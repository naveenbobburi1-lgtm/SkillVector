import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MarketGapAnalysis, MarketOutlook } from "./market";

export interface UserProfileForReport {
    username?: string;
    email?: string;
    age?: number;
    phone?: string;
    education_level?: string;
    current_status?: string;
    location?: string;
    skills?: string[];
    certifications?: { title: string; issuer: string }[];
    desired_role?: string;
    preferred_industries?: string[];
    expected_income?: string;
    relocation?: boolean;
    language?: string;
    learning_pace?: string;
    hours_per_week?: string;
    learning_format?: string[];
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

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    y = ensureSpace(doc, y, 20);
    // Accent bar
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(14, y - 1, 4, 12, 2, 2, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text(title, 22, y + 8);
    // Subtle line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, y + 14, pageWidth - 14, y + 14);
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
    // Box background
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, w, h, 3, 3, "F");
    // Value
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + w / 2, y + h / 2 - 2, { align: "center" });
    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(label, x + w / 2, y + h / 2 + 8, { align: "center" });
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
    doc.roundedRect(x, y - 5, tagWidth, 10, 2, 2, "F");
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
    const margin = 14;
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
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(gapAnalysis.role, pageWidth - margin, 33, { align: "right" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 220);
    doc.text(`SOC: ${gapAnalysis.soc_code}`, pageWidth - margin, 42, { align: "right" });

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
        if (userProfile.age) col1.push(["Age", String(userProfile.age)]);
        if (userProfile.phone) col1.push(["Phone", userProfile.phone]);
        if (userProfile.education_level) col1.push(["Education", userProfile.education_level]);

        if (userProfile.current_status) col2.push(["Current Status", userProfile.current_status]);
        if (userProfile.location) col2.push(["Location", userProfile.location]);
        if (userProfile.desired_role) col2.push(["Desired Role", userProfile.desired_role]);
        if (userProfile.expected_income) col2.push(["Expected Income", userProfile.expected_income]);
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
            autoTable(doc, {
                startY: y,
                head: [["Field", "Details", "Field", "Details"]],
                body: tableBody,
                theme: "plain",
                headStyles: {
                    fillColor: COLORS.lightGray,
                    textColor: COLORS.dark,
                    fontStyle: "bold",
                    fontSize: 8,
                },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    0: { fontStyle: "bold", textColor: COLORS.gray, cellWidth: 35 },
                    1: { textColor: COLORS.dark },
                    2: { fontStyle: "bold", textColor: COLORS.gray, cellWidth: 35 },
                    3: { textColor: COLORS.dark },
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
        if (userProfile.learning_format?.length) prefParts.push(`Format: ${userProfile.learning_format.join(", ")}`);
        if (userProfile.relocation !== undefined) prefParts.push(`Open to relocation: ${userProfile.relocation ? "Yes" : "No"}`);

        if (prefParts.length) {
            y = ensureSpace(doc, y, 20);
            doc.setFillColor(...COLORS.lightGray);
            doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.gray);
            doc.text("Learning Preferences:", margin + 4, y + 6);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...COLORS.dark);
            doc.text(prefParts.join("   |   "), margin + 40, y + 6);
            y += 20;
        }

        // Preferred Industries
        if (userProfile.preferred_industries?.length) {
            y = ensureSpace(doc, y, 16);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.gray);
            doc.text("Preferred Industries:", margin, y + 4);
            let tagX = margin + 38;
            for (const ind of userProfile.preferred_industries) {
                const tagW = drawSkillTag(doc, ind, tagX, y + 4, COLORS.primaryDark);
                tagX += tagW;
                if (tagX > pageWidth - margin - 20) {
                    tagX = margin + 38;
                    y += 12;
                    y = ensureSpace(doc, y, 16);
                }
            }
            y += 14;
        }

        // Certifications
        if (userProfile.certifications?.length) {
            y = ensureSpace(doc, y, 30);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.dark);
            doc.text("Certifications", margin, y + 4);
            y += 8;

            autoTable(doc, {
                startY: y,
                head: [["#", "Certification", "Issuer"]],
                body: userProfile.certifications.map((c, i) => [
                    String(i + 1),
                    c.title,
                    c.issuer,
                ]),
                theme: "striped",
                headStyles: { fillColor: COLORS.success, fontSize: 8 },
                styles: { fontSize: 9 },
                margin: { left: margin, right: margin },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
        }

        // User Skills
        if (userProfile.skills?.length) {
            y = ensureSpace(doc, y, 30);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.dark);
            doc.text(`Your Current Skills (${userProfile.skills.length})`, margin, y + 4);
            y += 10;

            let tagX = margin;
            for (const skill of userProfile.skills) {
                const skillName = typeof skill === "object" ? skill.name : skill;
                doc.setFontSize(8);
                const tw = doc.getTextWidth(skillName) + 8;
                if (tagX + tw > pageWidth - margin) {
                    tagX = margin;
                    y += 12;
                    y = ensureSpace(doc, y, 14);
                }
                drawSkillTag(doc, skillName, tagX, y, COLORS.primary);
                tagX += tw + 3;
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

    // KPI boxes row
    const kpiBoxW = (contentWidth - 12) / 4;
    drawKPIBox(doc, margin, y, kpiBoxW, 28, "PROFILE MATCH", `${coveragePercent}%`,
        coveragePercent >= 75 ? COLORS.success : coveragePercent >= 50 ? COLORS.warning : COLORS.error);
    drawKPIBox(doc, margin + kpiBoxW + 4, y, kpiBoxW, 28, "REQUIRED SKILLS", String(totalRequired), COLORS.primary);
    drawKPIBox(doc, margin + (kpiBoxW + 4) * 2, y, kpiBoxW, 28, "SKILLS MATCHED", String(matchedCount), COLORS.success);
    drawKPIBox(doc, margin + (kpiBoxW + 4) * 3, y, kpiBoxW, 28, "SKILL GAPS", String(missingCount),
        missingCount > 0 ? COLORS.error : COLORS.success);

    y += 38;

    // ============================================================
    // SECTION 3: MARKET OUTLOOK
    // ============================================================
    y = ensureSpace(doc, y, 50);
    y = drawSectionHeader(doc, "Market Outlook", y);

    autoTable(doc, {
        startY: y,
        head: [["Indicator", "Details"]],
        body: [
            ["Projected Growth", outlook.role_growth || "N/A"],
            ["Salary Competitiveness", outlook.salary_insight || "N/A"],
            ["Hot Sectors", (outlook.hot_sectors || []).join(", ") || "N/A"],
        ],
        theme: "striped",
        headStyles: { fillColor: COLORS.primary, fontSize: 9 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
        margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // AI outlook narrative
    if (outlook.market_outlook) {
        y = ensureSpace(doc, y, 40);
        doc.setFillColor(248, 250, 252);
        const outlookLines = doc.splitTextToSize(outlook.market_outlook, contentWidth - 16);
        const blockHeight = outlookLines.length * 5 + 16;
        y = ensureSpace(doc, y, blockHeight);
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
            columnStyles: { 0: { cellWidth: 12 } },
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
    // SECTION 5: SKILL GAP ANALYSIS (DETAILED)
    // ============================================================
    y = ensureSpace(doc, y, 50);
    y = drawSectionHeader(doc, "Skill Gap Analysis", y);

    // Coverage gauge + summary side by side
    y = ensureSpace(doc, y, 55);
    drawCoverageGauge(doc, margin + 30, y + 25, coveragePercent);

    // Summary text next to gauge
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.dark);
    const summaryX = margin + 70;
    doc.text(`Your profile covers ${coveragePercent}% of the standard market requirements`, summaryX, y + 10);
    doc.text(`for ${gapAnalysis.role} roles (SOC: ${gapAnalysis.soc_code}).`, summaryX, y + 18);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.success);
    doc.text(`${matchedCount} skills matched`, summaryX, y + 30);
    doc.setTextColor(...(missingCount > 0 ? COLORS.error : COLORS.success));
    doc.text(`${missingCount} skills missing`, summaryX + 45, y + 30);

    if (coveragePercent >= 75) {
        doc.setTextColor(...COLORS.success);
        doc.setFont("helvetica", "bold");
        doc.text("Strong candidate — minimal upskilling needed.", summaryX, y + 42);
    } else if (coveragePercent >= 50) {
        doc.setTextColor(...COLORS.warning);
        doc.setFont("helvetica", "bold");
        doc.text("Moderate gaps — targeted learning recommended.", summaryX, y + 42);
    } else {
        doc.setTextColor(...COLORS.error);
        doc.setFont("helvetica", "bold");
        doc.text("Significant gaps — structured learning plan suggested.", summaryX, y + 42);
    }

    y += 55;

    // Core Required Skills table
    if (gapAnalysis.insights.market_required_skills.length) {
        y = ensureSpace(doc, y, 40);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text(`Core Required Skills (${totalRequired})`, margin, y + 4);
        y += 8;

        autoTable(doc, {
            startY: y,
            head: [["#", "Skill", "Your Status"]],
            body: gapAnalysis.insights.market_required_skills.map((s, i) => {
                const hasSkill = userProfile?.skills?.some(
                    (us) => (typeof us === "object" ? us.name : us).toLowerCase() === s.toLowerCase()
                );
                return [String(i + 1), s, hasSkill ? "Acquired" : "Missing"];
            }),
            theme: "striped",
            headStyles: { fillColor: COLORS.primary, fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 12 } },
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
            body: gapAnalysis.insights.missing_skills.map((s, i) => [
                String(i + 1),
                s,
                i < 3 ? "High" : i < 6 ? "Medium" : "Normal",
            ]),
            theme: "striped",
            headStyles: { fillColor: COLORS.error, fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { cellWidth: 12 } },
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

    recommendations.forEach((rec, i) => {
        y = ensureSpace(doc, y, 16);
        doc.setFillColor(...COLORS.lightGray);
        const recLines = doc.splitTextToSize(rec, contentWidth - 22);
        const recHeight = recLines.length * 5 + 8;
        doc.roundedRect(margin, y, contentWidth, recHeight, 2, 2, "F");

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.primary);
        doc.text(`${i + 1}.`, margin + 4, y + 7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.dark);
        doc.text(recLines, margin + 12, y + 7);
        y += recHeight + 4;
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
