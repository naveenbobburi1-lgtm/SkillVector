"""
Tests for admin service utilities.
"""
import pytest
import re
from services.admin_service import extract_youtube_id


class TestExtractYoutubeId:
    def test_standard_watch_url(self):
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"

    def test_short_url(self):
        url = "https://youtu.be/dQw4w9WgXcQ"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"

    def test_embed_url(self):
        url = "https://www.youtube.com/embed/dQw4w9WgXcQ"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"

    def test_url_with_extra_params(self):
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"

    def test_invalid_url_raises(self):
        with pytest.raises(ValueError, match="Invalid YouTube URL"):
            extract_youtube_id("https://example.com/not-a-video")

    def test_v_url_format(self):
        url = "https://www.youtube.com/v/dQw4w9WgXcQ"
        assert extract_youtube_id(url) == "dQw4w9WgXcQ"
