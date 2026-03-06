from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from db.database import get_db
from db.models import UserDB, VideoAssignment, UserVideoAssignment, VideoProgress
from auth import get_current_user

router = APIRouter()


@router.get("/my-assignments")
async def get_my_assignments(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """Get videos assigned to the current user."""
    assignments = db.query(UserVideoAssignment).filter(
        UserVideoAssignment.user_id == current_user.id
    ).all()

    result = []
    for a in assignments:
        video = db.query(VideoAssignment).filter(VideoAssignment.id == a.video_id, VideoAssignment.is_active == True).first()
        if not video:
            continue

        progress = db.query(VideoProgress).filter(
            VideoProgress.user_id == current_user.id,
            VideoProgress.video_id == video.id
        ).first()

        result.append({
            "assignment_id": a.id,
            "video_id": video.id,
            "title": video.title,
            "youtube_url": video.youtube_url,
            "youtube_video_id": video.youtube_video_id,
            "description": video.description,
            "duration_seconds": video.duration_seconds,
            "category": video.category,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "is_mandatory": a.is_mandatory,
            "watched_seconds": progress.watched_seconds if progress else 0,
            "completion_percent": round(progress.completion_percent, 1) if progress else 0,
            "is_completed": progress.is_completed if progress else False,
        })

    return {"assignments": result}


@router.post("/video-progress/heartbeat")
async def video_heartbeat(
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """
    Anti-cheat video watching heartbeat.
    Frontend sends this every 5 seconds while watching.
    Validates that watching is legitimate (no fast-forwarding beyond threshold).
    """
    payload = await request.json()
    video_id = payload.get("video_id")
    # Accept both field names for compatibility
    current_time = payload.get("current_time") or payload.get("current_position", 0)
    event_type = payload.get("event_type", "heartbeat")
    is_playing = payload.get("is_playing", event_type not in ("pause", "ended"))
    session_watched = payload.get("session_watched", 5 if is_playing else 0)  # Default ~5s per heartbeat interval

    if not video_id:
        raise HTTPException(status_code=400, detail="video_id required")

    video = db.query(VideoAssignment).filter(VideoAssignment.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    progress = db.query(VideoProgress).filter(
        VideoProgress.user_id == current_user.id,
        VideoProgress.video_id == video_id
    ).first()

    if not progress:
        progress = VideoProgress(user_id=current_user.id, video_id=video_id)
        db.add(progress)
        db.flush()

    now = datetime.now(timezone.utc)

    # Anti-cheat: detect if user jumped too far ahead (>15 seconds beyond max_position)
    if current_time > progress.max_position + 15:
        progress.cheat_flags += 1
        # Don't update max_position for cheated seeks
    else:
        # Legitimate watching - update max position
        if current_time > progress.max_position:
            progress.max_position = int(current_time)

    # Update watched seconds (only count legitimate time)
    if is_playing and session_watched > 0:
        # Sanity check: session_watched shouldn't be more than heartbeat interval + buffer
        legitimate_increment = min(session_watched, 8)  # Max 8s per 5s heartbeat (with tolerance)
        progress.watched_seconds = min(
            progress.watched_seconds + int(legitimate_increment),
            video.duration_seconds  # Can't exceed video length
        )

    if not is_playing:
        progress.total_pauses += 1

    # Calculate completion based on max legitimate position
    if video.duration_seconds > 0:
        progress.completion_percent = min(
            (progress.max_position / video.duration_seconds) * 100,
            100.0
        )

    # Mark as completed if >90% watched legitimately
    if progress.completion_percent >= 90 and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = now

    progress.last_heartbeat = now
    db.commit()

    return {
        "watched_seconds": progress.watched_seconds,
        "max_position": progress.max_position,
        "completion_percent": round(progress.completion_percent, 1),
        "is_completed": progress.is_completed,
        "cheat_flags": progress.cheat_flags,
    }
