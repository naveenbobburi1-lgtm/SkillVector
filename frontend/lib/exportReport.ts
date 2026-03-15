import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MarketGapAnalysis, MarketOutlook } from "./market";

export interface UserProfileForReport {
    username?: string;
    email?: string;
    education_level?: string;
    current_status?: string;
    location?: string;
    skills?: (string | { name: string; proficiency?: string })[];
    desired_role?: string;
    preferred_industries?: string[];
    language?: string;
    learning_pace?: string;
    hours_per_week?: string;
    budget_sensitivity?: string;
    timeline?: string;
}

// Color palette
const COLORS = {
    primary: [99, 102, 241] as [number, number, number],
    primaryDark: [79, 70, 229] as [number, number, number],
    success: [16, 185, 129] as [number, number, number],
    warning: [245, 158, 11] as [number, number, number],
    error: [239, 68, 68] as [number, number, number],
    dark: [30, 30, 46] as [number, number, number],
    gray: [100, 116, 139] as [number, number, number],
    lightGray: [241, 245, 249] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
};

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > doc.internal.pageSize.getHeight() - 25) {
        doc.addPage();
        return 20;
    }
    return y;
}

const MARGIN = 14;

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    y = ensureSpace(doc, y, 24);
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(MARGIN, y - 1, 4, 12, 2, 2, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text(title, MARGIN + 8, y + 8);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 14, pageWidth - MARGIN, y + 14);
    return y + 20;
}

function drawKPIBox(
    doc: jsPDF,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    value: string,
    color: [number, number, number]
) {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, w, h, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + w / 2, y + h / 2 - 6, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(label, x + w / 2, y + h / 2 + 4, { align: "center" });
}

function drawCoverageGauge(doc: jsPDF, x: number, y: number, percent: number) {
    const radius = 22;
    const cx = x;
    const cy = y;

    // Background circle
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(5);
    doc.circle(cx, cy, radius, "S");

    // Foreground arc: draw as colored circle overlay
    const color = percent >= 75 ? COLORS.success : percent >= 50 ? COLORS.warning : COLORS.error;
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(5);
    // Approximate arc with a partial circle drawing
    const segments = Math.round((percent / 100) * 36);
    for (let i = 0; i < segments; i++) {
        const angle1 = ((i * 10 - 90) * Math.PI) / 180;
        const angle2 = (((i + 1) * 10 - 90) * Math.PI) / 180;
        const x1 = cx + radius * Math.cos(angle1);
        const y1 = cy + radius * Math.sin(angle1);
        const x2 = cx + radius * Math.cos(angle2);
        const y2 = cy + radius * Math.sin(angle2);
        doc.line(x1, y1, x2, y2);
    }

    // Center text
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${percent}%`, cx, cy + 2, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text("Match", cx, cy + 9, { align: "center" });
}

function drawSkillTag(doc: jsPDF, text: string, x: number, y: number, color: [number, number, number]): number {
    const padding = 4;
    doc.setFontSize(8);
    const textWidth = doc.getTextWidth(text);
    const tagWidth = textWidth + padding * 2;

    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y - 6, tagWidth, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text(text, x + padding, y + 1);

    return tagWidth + 3; // return width consumed + gap
}

export function exportMarketInsightsReport(
    gapAnalysis: MarketGapAnalysis,
    outlook: MarketOutlook,
    userProfile?: UserProfileForReport | null
) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = MARGIN;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // ============================================================
    // PAGE 1: COVER / HEADER
    // ============================================================

    // Full-width gradient header
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pageWidth, 55, "F");
    // Accent strip
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 55, pageWidth, 3, "F");

    // Logo / Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("SkillVector", margin, 22);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 220);
    doc.text("Comprehensive Market Insights Report", margin, 33);

    // Right side: date & role
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 230);
    const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    doc.text(dateStr, pageWidth - margin, 22, { align: "right" });
    
    // Dynamically truncate role text if it is too wide
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    let displayRole = gapAnalysis.role || "";
    const maxRoleWidth = 90; // enough space before hitting title
    if (doc.getTextWidth(displayRole) > maxRoleWidth) {
        while (displayRole.length > 0 && doc.getTextWidth(displayRole + "...") > maxRoleWidth) {
            displayRole = displayRole.slice(0, -1);
        }
        displayRole += "...";
    }
    doc.text(displayRole, pageWidth - margin, 33, { align: "right" });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 220);
    doc.text(`SOC: ${gapAnalysis.soc_code}`, pageWidth - margin, 42, { align: "right" });
    doc.setFontSize(7);
    doc.text("Data: Real-time (Exa) + Static (O*NET)", pageWidth - margin, 50, { align: "right" });

    y = 68;

    // ============================================================
    // SECTION 1: USER PROFILE OVERVIEW
    // ============================================================
    if (userProfile) {
        y = drawSectionHeader(doc, "User Profile", y);

        // Two-column profile layout
        const col1: [string, string][] = [];
        const col2: [string, string][] = [];

        if (userProfile.username) col1.push(["Name", userProfile.username]);
        if (userProfile.email) col1.push(["Email", userProfile.email]);
        if (userProfile.education_level) col1.push(["Education", userProfile.education_level]);

        if (userProfile.current_status) col2.push(["Current Status", userProfile.current_status]);
        if (userProfile.location) col2.push(["Location", userProfile.location]);
        if (userProfile.desired_role) col2.push(["Desired Role", userProfile.desired_role]);
        if (userProfile.language) col2.push(["Language", userProfile.language]);

        // Draw both columns as one table
        const maxRows = Math.max(col1.length, col2.length);
        const tableBody: string[][] = [];
        for (let i = 0; i < maxRows; i++) {
            tableBody.push([
                col1[i]?.[0] || "",
                col1[i]?.[1] || "",
                col2[i]?.[0] || "",
                col2[i]?.[1] || "",
            ]);
        }

        if (tableBody.length) {
            const colW = contentWidth / 4;
            autoTable(doc, {
                startY: y,
                head: [["Field", "Details", "Field", "Details"]],
                body: tableBody,
                theme: "plain",
                tableWidth: contentWidth,
                headStyles: {
                    fillColor: COLORS.lightGray,
                    textColor: COLORS.dark,
                    fontStyle: "bold",
                    fontSize: 8,
                },
                styles: { fontSize: 9, cellPadding: 4 },
                columnStyles: {
                    0: { fontStyle: "bold", textColor: COLORS.gray, cellWidth: colW },
                    1: { textColor: COLORS.dark, cellWidth: colW },
                    2: { fontStyle: "bold", textColor: COLORS.gray, cellWidth: colW },
                    3: { textColor: COLORS.dark, cellWidth: colW },
                },
                margin: { left: margin, right: margin },
            });
            y = (doc as any).lastAutoTable.finalY + 6;
        }

        // Learning Preferences row
        const prefParts: string[] = [];
        if (userProfile.learning_pace) prefParts.push(`Pace: ${userProfile.learning_pace}`);
        if (userProfile.hours_per_week) prefParts.push(`${userProfile.hours_per_week} hrs/week`);
        if (userProfile.timeline) prefParts.push(`Timeline: ${userProfile.timeline}`);
        if (userProfile.budget_sensitivity) prefParts.push(`Budget: ${userProfile.budget_sensitivity}`);

        if (prefParts.length) {
            const prefText = prefParts.join("   |   ");
            doc.setFontSize(8);
            const prefWrapped = doc.splitTextToSize(prefText, contentWidth - 56);
            const blockHeight = Math.max(14, prefWrapped.length * 4 + 8);
            y = ensureSpace(doc, y, blockHeight + 6);
            
            doc.setFillColor(...COLORS.lightGray);
            doc.roundedRect(margin, y, contentWidth, blockHeight, 2, 2, "F");
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.gray);
            doc.text("Learning Preferences:", margin + 4, y + 8);
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...COLORS.dark);
            doc.text(prefWrapped, margin + 50, y + 8);
            y += blockHeight + 6;
        }

        // Preferred Industries
        if (userProfile.preferred_industries?.length) {
            y = ensureSpace(doc, y, 16);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.gray);
            doc.text("Preferred Industries:", margin, y + 4);
            const labelWidth = 48;
            let tagX = margin + labelWidth;
            
            for (const ind of userProfile.preferred_industries) {
                doc.setFontSize(8);
                const tagW = doc.getTextWidth(ind) + 11; // 8 padding + 3 gap
                if (tagX + tagW > pageWidth - margin) {
                    tagX = margin + labelWidth;
                    y += 14;
                    y = ensureSpace(doc, y, 16);
                }
                drawSkillTag(doc, ind, tagX, y + 4, COLORS.primaryDark);
                tagX += tagW;
            }
            y += 16;
        }

        // User Skills
        if (userProfile.skills?.length) {
            y = ensureSpace(doc, y, 30);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.dark);
            doc.text(`Your Current Skills (${userProfile.skills.length})`, margin, y + 4);
            y += 12;

            let tagX = margin;
            for (const skill of userProfile.skills) {
                const skillName = typeof skill === "object" ? skill.name : skill;
                doc.setFontSize(8);
                const tagW = doc.getTextWidth(skillName) + 11;
                if (tagX + tagW > pageWidth - margin) {
                    tagX = margin;
                    y += 14;
                    y = ensureSpace(doc, y, 16);
                }
                drawSkillTag(doc, skillName, tagX, y, COLORS.primary);
                tagX += tagW;
            }
            y += 18;
        }
    }

    // ============================================================
    // SECTION 2: KEY PERFORMANCE INDICATORS
    // ============================================================
    y = ensureSpace(doc, y, 55);
    y = drawSectionHeader(doc, "Key Performance Indicators", y);

    const coveragePercent = gapAnalysis.insights.skill_coverage_percent;
    const totalRequired = gapAnalysis.insights.market_required_skills.length;
    const missingCount = gapAnalysis.insights.missing_skills.length;
    const matchedCount = totalRequired - missingCount;

    // KPI boxes row - equal width with consistent gaps
    const kpiGap = 4;
    const kpiBoxW = (contentWidth - kpiGap * 3) / 4;
    drawKPIBox(doc, margin, y, kpiBoxW, 28, "PROFILE MATCH", `${coveragePercent}%`,
        coveragePercent >= 75 ? COLORS.success : coveragePercent >= 50 ? COLORS.warning : COLORS.error);
    drawKPIBox(doc, margin + kpiBoxW + kpiGap, y, kpiBoxW, 28, "REQUIRED", String(totalRequired), COLORS.primary);
    drawKPIBox(doc, margin + (kpiBoxW + kpiGap) * 2, y, kpiBoxW, 28, "MATCHED", String(matchedCount), COLORS.success);
    drawKPIBox(doc, margin + (kpiBoxW + kpiGap) * 3, y, kpiBoxW, 28, "GAPS", String(missingCount),
        missingCount > 0 ? COLORS.error : COLORS.success);

    y += 40;

    // ============================================================
    // SECTION 3a: REAL-TIME MARKET DATA (Exa)
    // ============================================================
    const realtime = outlook.realtime;
    if (realtime) {
        y = ensureSpace(doc, y, 50);
        y = drawSectionHeader(doc, "Real-time Market Data (Exa API)", y);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.gray);
        doc.text("Live data from web search — updated on each refresh", margin, y + 4);
        y += 10;

        autoTable(doc, {
            startY: y,
            head: [["Metric", "Value"]],
            body: [
                ["Growth Rate", realtime.growth_rate || "N/A"],
                ["Total Jobs", realtime.total_jobs || "N/A"],
                ["Starting Salary", realtime.starting_salary || "N/A"],
                ["Average Salary", realtime.average_salary || "N/A"],
                ["Max Salary", realtime.max_salary || "N/A"],
            ],
            theme: "striped",
            tableWidth: contentWidth,
            headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: contentWidth - 50 } },
            margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        // Real-time training skills
        const exaSkills = realtime.training_skills || gapAnalysis.exa_skills || [];
        if (exaSkills.length) {
            y = ensureSpace(doc, y, 30);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.dark);
            doc.text(`Real-time Training Skills (Exa) — ${exaSkills.length} skills`, margin, y + 4);
            y += 12;
            let tagX = margin;
            for (const skill of exaSkills) {
                doc.setFontSize(8);
                const tagW = doc.getTextWidth(skill) + 11;
                if (tagX + tagW > pageWidth - margin) {
                    tagX = margin;
                    y += 14;
                    y = ensureSpace(doc, y, 16);
                }
                drawSkillTag(doc, skill, tagX, y, COLORS.success);
                tagX += tagW;
            }
            y += 18;
        }
    }

    // O*NET skills (static)
    if (gapAnalysis.onet_skills?.length) {
        y = ensureSpace(doc, y, 30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text(`O*NET Occupational Skills (Static) — ${gapAnalysis.onet_skills.length} skills`, margin, y + 4);
        y += 12;
        let tagX = margin;
        for (const skill of gapAnalysis.onet_skills) {
            doc.setFontSize(8);
            const tagW = doc.getTextWidth(skill) + 11;
            if (tagX + tagW > pageWidth - margin) {
                tagX = margin;
                y += 14;
                y = ensureSpace(doc, y, 16);
            }
            drawSkillTag(doc, skill, tagX, y, COLORS.primary);
            tagX += tagW;
        }
        y += 18;
    }

    // ============================================================
    // SECTION 3b: STATIC MARKET OUTLOOK (O*NET)
    // ============================================================
    y = ensureSpace(doc, y, 50);
    y = drawSectionHeader(doc, "Static Market Outlook (O*NET & AI)", y);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text("Occupational data and AI-derived insights", margin, y + 4);
    y += 10;

    autoTable(doc, {
        startY: y,
        head: [["Indicator", "Details"]],
        body: [
            ["Projected Growth", outlook.role_growth || "N/A"],
            ["Salary Competitiveness", outlook.salary_insight || "N/A"],
            ["Hot Sectors", (outlook.hot_sectors || []).join(", ") || "N/A"],
        ],
        theme: "striped",
        tableWidth: contentWidth,
        headStyles: { fillColor: COLORS.primary, fontSize: 9 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: contentWidth - 50 } },
        margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // AI outlook narrative
    if (outlook.market_outlook) {
        y = ensureSpace(doc, y, 40);
        doc.setFillColor(248, 250, 252);
        const outlookLines = doc.splitTextToSize(outlook.market_outlook, contentWidth - 16);
        const blockHeight = outlookLines.length * 5 + 16;
        y = ensureSpace(doc, y, blockHeight + 10);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, y, contentWidth, blockHeight, 3, 3, "F");
        // Left accent
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(margin, y, 3, blockHeight, 1.5, 1.5, "F");

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.primary);
        doc.text("AI Market Outlook", margin + 10, y + 10);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.dark);
        doc.text(outlookLines, margin + 10, y + 18);
        y += blockHeight + 10;
    }

    // ============================================================
    // SECTION 4: TRENDING SKILLS
    // ============================================================
    if (outlook.trending_skills?.length) {
        y = ensureSpace(doc, y, 40);
        y = drawSectionHeader(doc, "Trending Skills to Watch", y);

        autoTable(doc, {
            startY: y,
            head: [["#", "Skill", "Status"]],
            tableWidth: contentWidth,
            columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: contentWidth - 90 }, 2: { cellWidth: 40 } },
            body: outlook.trending_skills.map((s, i) => [
                String(i + 1),
                s,
                userProfile?.skills?.some(
                    (us) => (typeof us === "object" ? us.name : us).toLowerCase() === s.toLowerCase()
                )
                    ? "You have this"
                    : "Consider learning",
            ]),
            theme: "striped",
            headStyles: { fillColor: COLORS.primary, fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 4 },
            didParseCell: (data: any) => {
                if (data.section === "body" && data.column.index === 2) {
                    if (data.cell.raw === "You have this") {
                        data.cell.styles.textColor = COLORS.success;
                        data.cell.styles.fontStyle = "bold";
                    } else {
                        data.cell.styles.textColor = COLORS.warning;
                    }
                }
            },
            margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ============================================================
    // SECTION 5: SKILL GAP ANALYSIS (Exa + O*NET Combined)
    // ============================================================
    y = ensureSpace(doc, y, 50);
    y = drawSectionHeader(doc, "Skill Gap Analysis (Exa + O*NET)", y);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text("Missing skills derived from Real-time (Exa) + O*NET requirements", margin, y + 4);
    y += 10;

    // Coverage gauge + summary side by side
    y = ensureSpace(doc, y, 55);
    const gaugeCenterY = y + 25;
    drawCoverageGauge(doc, margin + 30, gaugeCenterY, coveragePercent);

    // Summary text next to gauge
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.dark);
    const summaryX = margin + 64;
    const summaryW = pageWidth - summaryX - margin;
    const line1 = doc.splitTextToSize(`Your profile covers ${coveragePercent}% of market requirements (Exa + O*NET) for ${gapAnalysis.role} roles (SOC: ${gapAnalysis.soc_code}).`, summaryW);
    let summaryY = y + 10;
    doc.text(line1, summaryX, summaryY);
    const line1Height = (Array.isArray(line1) ? line1.length : 1) * 5;
    summaryY += line1Height + 6;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.success);
    doc.text(`${matchedCount} skills matched`, summaryX, summaryY);
    doc.setTextColor(...(missingCount > 0 ? COLORS.error : COLORS.success));
    doc.text(`${missingCount} skills missing`, summaryX, summaryY + 10);
    summaryY += 18;
    const skillsLineY = summaryY;
    if (coveragePercent >= 75) {
        doc.setTextColor(...COLORS.success);
        doc.setFont("helvetica", "bold");
        doc.text("Strong candidate — minimal upskilling needed.", summaryX, skillsLineY);
    } else if (coveragePercent >= 50) {
        doc.setTextColor(...COLORS.warning);
        doc.setFont("helvetica", "bold");
        doc.text("Moderate gaps — targeted learning recommended.", summaryX, skillsLineY);
    } else {
        doc.setTextColor(...COLORS.error);
        doc.setFont("helvetica", "bold");
        doc.text("Significant gaps — structured learning plan suggested.", summaryX, skillsLineY);
    }

    // Ensure we clear both the gauge and the text
    y = Math.max(gaugeCenterY + 30, skillsLineY + 12);

    // Core Required Skills table (Exa + O*NET combined)
    if (gapAnalysis.insights.market_required_skills.length) {
        y = ensureSpace(doc, y, 40);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text(`Core Required Skills — Exa + O*NET (${totalRequired})`, margin, y + 4);
        y += 8;

        autoTable(doc, {
            startY: y,
            head: [["#", "Skill", "Your Status"]],
            tableWidth: contentWidth,
            columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: contentWidth - 55 }, 2: { cellWidth: 35 } },
            body: gapAnalysis.insights.market_required_skills.map((s, i) => {
                const hasSkill = userProfile?.skills?.some(
                    (us) => (typeof us === "object" ? us.name : us).toLowerCase() === s.toLowerCase()
                );
                return [String(i + 1), s, hasSkill ? "Acquired" : "Missing"];
            }),
            theme: "striped",
            headStyles: { fillColor: COLORS.primary, fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            didParseCell: (data: any) => {
                if (data.section === "body" && data.column.index === 2) {
                    if (data.cell.raw === "Acquired") {
                        data.cell.styles.textColor = COLORS.success;
                        data.cell.styles.fontStyle = "bold";
                    } else {
                        data.cell.styles.textColor = COLORS.error;
                        data.cell.styles.fontStyle = "bold";
                    }
                }
            },
            margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Critical Gaps — highlighted separately
    if (gapAnalysis.insights.missing_skills.length) {
        y = ensureSpace(doc, y, 40);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.error);
        doc.text(`Critical Skill Gaps (${missingCount})`, margin, y + 4);
        y += 8;

        autoTable(doc, {
            startY: y,
            head: [["#", "Missing Skill", "Priority"]],
            tableWidth: contentWidth,
            columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: contentWidth - 50 }, 2: { cellWidth: 30 } },
            body: gapAnalysis.insights.missing_skills.map((s, i) => [
                String(i + 1),
                s,
                i < 3 ? "High" : i < 6 ? "Medium" : "Normal",
            ]),
            theme: "striped",
            headStyles: { fillColor: COLORS.error, fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            didParseCell: (data: any) => {
                if (data.section === "body" && data.column.index === 2) {
                    const p = data.cell.raw;
                    if (p === "High") {
                        data.cell.styles.textColor = COLORS.error;
                        data.cell.styles.fontStyle = "bold";
                    } else if (p === "Medium") {
                        data.cell.styles.textColor = COLORS.warning;
                        data.cell.styles.fontStyle = "bold";
                    }
                }
            },
            margin: { left: margin, right: margin },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // ============================================================
    // SECTION 6: RECOMMENDATIONS
    // ============================================================
    y = ensureSpace(doc, y, 60);
    y = drawSectionHeader(doc, "Recommendations", y);

    const recommendations: string[] = [];

    if (missingCount > 0) {
        recommendations.push(
            `Focus on acquiring the top ${Math.min(3, missingCount)} high-priority missing skills first: ${gapAnalysis.insights.missing_skills.slice(0, 3).join(", ")}.`
        );
    }
    if (coveragePercent < 75) {
        recommendations.push(
            `Your current coverage is ${coveragePercent}%. Aim to reach 75%+ to be competitive in ${gapAnalysis.role} roles.`
        );
    }
    if (outlook.trending_skills?.length) {
        const trendingNotOwned = outlook.trending_skills.filter(
            (s) => !userProfile?.skills?.some((us) => (typeof us === "object" ? us.name : us).toLowerCase() === s.toLowerCase())
        );
        if (trendingNotOwned.length > 0) {
            recommendations.push(
                `Consider learning these trending skills: ${trendingNotOwned.slice(0, 4).join(", ")}.`
            );
        }
    }
    if (userProfile?.learning_pace) {
        recommendations.push(
            `At your ${userProfile.learning_pace} learning pace${userProfile.hours_per_week ? ` (${userProfile.hours_per_week} hrs/week)` : ""}, plan structured daily practice sessions for consistent progress.`
        );
    }
    if (coveragePercent >= 75) {
        recommendations.push(
            "You're well-positioned. Consider pursuing advanced certifications or specializations to stand out further."
        );
    }
    if (recommendations.length === 0) {
        recommendations.push("Keep your skills current and monitor market trends regularly.");
    }

    const numWidth = 10;
    recommendations.forEach((rec, i) => {
        const recLines = doc.splitTextToSize(rec, contentWidth - numWidth - 8);
        const recHeight = Math.max(14, recLines.length * 5 + 8);
        y = ensureSpace(doc, y, recHeight + 4);
        doc.setFillColor(...COLORS.lightGray);
        doc.roundedRect(margin, y, contentWidth, recHeight, 2, 2, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.primary);
        doc.text(`${i + 1}.`, margin + 5, y + 7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.dark);
        doc.text(recLines, margin + numWidth, y + 7);
        y += recHeight + 6;
    });

    // ============================================================
    // FOOTER ON ALL PAGES
    // ============================================================
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        // Footer line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
        // Left: branding
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 180, 180);
        doc.text("SkillVector  |  Comprehensive Market Insights Report", margin, pageHeight - 8);
        // Right: page number
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
        // Center: confidential
        doc.text("Confidential", pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    // ============================================================
    // SAVE
    // ============================================================
    const safeName = gapAnalysis.role.replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`SkillVector_Market_Report_${safeName}.pdf`);
}
