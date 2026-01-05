
import { Subject, Chapter, Note } from '../types';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';

declare var html2pdf: any;

const extensions = [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Image.configure({ inline: false, allowBase64: true }),
    TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true })
];

// Helper to convert Markdown Table to HTML Table for PDF
const parseMarkdownTableToHtml = (markdown: string) => {
    if (!markdown) return '';
    const lines = markdown.split('\n').filter(line => line.trim().startsWith('|'));
    if (lines.length === 0) return `<p>${markdown}</p>`;

    let html = '<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">';
    
    lines.forEach((line, index) => {
        // Skip separator lines like |---|---|
        if (line.includes('---')) return;

        const cells = line.split('|').filter(cell => cell.trim() !== '').map(c => c.trim());
        
        html += '<tr>';
        cells.forEach(cell => {
            if (index === 0) {
                html += `<th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f1f5f9; text-align: left;">${cell}</th>`;
            } else {
                html += `<td style="border: 1px solid #cbd5e1; padding: 8px;">${cell}</td>`;
            }
        });
        html += '</tr>';
    });

    html += '</table>';
    return html;
};

export const downloadNotebookPDF = async (
    subject: Subject,
    chapters: Chapter[],
    notes: Note[]
) => {
    // Filter content
    const subjectChapters = chapters.filter(c => c.subjectId === subject.id);
    const subjectNotes = notes.filter(n => n.subjectId === subject.id);
    
    // Determine suffix
    const fileSuffix = subject.isSummary ? '_Summary_Deck' : '_Notebook';

    // Build HTML Content
    const container = document.createElement('div');
    container.style.padding = '40px';
    container.style.fontFamily = "'Nunito', sans-serif";
    container.style.color = '#334155';

    // 1. Determine Background Style
    const bgStyle = subject.coverImage?.includes('http') || subject.coverImage?.startsWith('data:')
      ? `background-image: url('${subject.coverImage}'); background-size: cover; background-position: center;` 
      : `background: ${subject.coverImage || 'white'};`;

    // --- PAGE 1: TITLE PAGE ---
    const titlePage = document.createElement('div');
    titlePage.innerHTML = `
        <div style="height: 1123px; width: 100%; position: relative; ${bgStyle} display: flex; align-items: center; justify-content: center;">
            
            <!-- Overlay Box for Readability -->
            <div style="background: rgba(255, 255, 255, 0.9); padding: 60px; max-width: 80%; width: 600px; text-align: center; border: 1px solid #000; box-shadow: 0 20px 50px rgba(0,0,0,0.2);">
                
                <div style="font-family: 'Times New Roman', serif; color: #000;">
                    <!-- Serious Header -->
                    <h1 style="font-size: 48px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; line-height: 1.2;">
                        ${subject.title}
                    </h1>
                    
                    <div style="width: 80px; height: 3px; background: #000; margin: 30px auto;"></div>

                    <!-- Student Details -->
                    <div style="font-size: 18px; line-height: 1.6; margin-top: 30px;">
                        <p style="margin: 0; font-weight: bold; font-size: 22px;">Pauline Galias</p>
                        <p style="margin: 0; margin-top: 5px;">DLSU Manila</p>
                        <p style="margin: 0;">BS Physics with Specialization in Medical Instrumentation</p>
                        <p style="margin: 0; margin-top: 5px;">ID: 12417718</p>
                        <p style="margin: 0; font-style: italic;">paulino_galias@dlsu.edu.ph</p>
                    </div>

                    <!-- Term Info -->
                    <div style="margin-top: 40px; font-size: 14px; color: #444; text-transform: uppercase; letter-spacing: 1px;">
                        ${subject.term} &bull; ${subject.year}
                    </div>
                    <div style="margin-top: 20px; font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase;">
                        ${subject.isSummary ? 'Summary & Condensed Review' : 'Complete Course Notebook'}
                    </div>
                </div>

            </div>
        </div>
        <div style="page-break-after: always;"></div>
    `;
    container.appendChild(titlePage);

    // --- PAGE 2: SUMMARY OF CONTENTS ---
    const summaryPage = document.createElement('div');
    summaryPage.style.padding = '20px';
    let summaryHtml = `
        <h1 style="font-size: 36px; font-weight: 900; color: #0f172a; margin-bottom: 40px; text-transform: uppercase; border-bottom: 4px solid #0f172a; padding-bottom: 10px;">
            Summary of Contents
        </h1>
    `;

    let hasSummary = false;
    subjectChapters.forEach(chapter => {
        if (chapter.summaryTable) {
            hasSummary = true;
            summaryHtml += `
                <div style="margin-bottom: 40px;">
                    <h2 style="font-size: 24px; font-weight: 800; color: #334155; margin-bottom: 15px;">
                        ${chapter.title}
                    </h2>
                    ${parseMarkdownTableToHtml(chapter.summaryTable)}
                </div>
            `;
        }
    });

    if (!hasSummary) {
        summaryHtml += `<p style="font-style: italic; color: #64748b;">No summary tables generated yet. Use the "Update Table" button in the app to create summaries.</p>`;
    }

    summaryHtml += `<div style="page-break-after: always;"></div>`;
    summaryPage.innerHTML = summaryHtml;
    container.appendChild(summaryPage);


    // --- MIDDLE: CHAPTERS & NOTES ---
    subjectChapters.forEach(chapter => {
        // Chapter Header
        const chapterDiv = document.createElement('div');
        chapterDiv.innerHTML = `
            <h2 style="font-size: 32px; font-weight: 800; border-bottom: 4px solid #cbd5e1; padding-bottom: 10px; margin-top: 40px; margin-bottom: 30px;">
                Chapter: ${chapter.title}
            </h2>
        `;
        container.appendChild(chapterDiv);

        const chapterNotes = subjectNotes.filter(n => n.chapterId === chapter.id);

        chapterNotes.forEach(note => {
            const noteDiv = document.createElement('div');
            noteDiv.style.marginBottom = '60px';
            noteDiv.style.pageBreakInside = 'avoid';

            // Convert Editor Content to HTML
            let contentHtml = '';
            if (note.content.editorContent) {
                try {
                    contentHtml = generateHTML(note.content.editorContent, extensions);
                } catch (e) {
                    contentHtml = `<p>${note.content.extendedExplanation || 'No content.'}</p>`;
                }
            } else {
                 contentHtml = `<p>${note.content.extendedExplanation || 'No content.'}</p>`;
            }

            // Note Header
            noteDiv.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 24px; font-weight: 900; margin: 0; color: #0f172a;">${note.content.title}</h3>
                    <div style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase;">${note.content.subtopic}</div>
                </div>
                <div class="note-content" style="line-height: 1.6; font-size: 14px;">
                    ${contentHtml}
                </div>
            `;

            // Problems
            if (note.content.classProblems && note.content.classProblems.length > 0) {
                const probDiv = document.createElement('div');
                probDiv.style.marginTop = '20px';
                probDiv.style.padding = '20px';
                probDiv.style.backgroundColor = '#f8fafc';
                probDiv.style.borderRadius = '10px';
                
                let probHtml = '<h4 style="font-weight: 800; margin-bottom: 15px;">Practice Problems</h4>';
                note.content.classProblems.forEach((p, idx) => {
                    probHtml += `
                        <div style="margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                            <div style="font-weight: bold; margin-bottom: 5px;">${idx + 1}. ${p.question}</div>
                            <div style="font-family: monospace; font-size: 12px; color: #475569; margin-bottom: 5px;">Answer: ${p.answer}</div>
                        </div>
                    `;
                });
                probDiv.innerHTML = probHtml;
                noteDiv.appendChild(probDiv);
            }

            container.appendChild(noteDiv);
        });

        // Page Break after chapter
        const breakDiv = document.createElement('div');
        breakDiv.style.pageBreakAfter = 'always';
        container.appendChild(breakDiv);
    });

    // --- LAST PAGE: MASTER FORMULA SHEET ---
    // Aggregate formulas from all notes
    const allFormulas: string[] = [];
    subjectNotes.forEach(note => {
        note.content.classProblems.forEach(prob => {
            if (prob.formulas && Array.isArray(prob.formulas)) {
                allFormulas.push(...prob.formulas);
            }
        });
    });
    // Deduplicate
    const uniqueFormulas = Array.from(new Set(allFormulas));

    const formulaPage = document.createElement('div');
    formulaPage.style.padding = '20px';
    formulaPage.innerHTML = `
        <h1 style="font-size: 36px; font-weight: 900; color: #0f172a; margin-bottom: 40px; text-transform: uppercase; border-bottom: 4px solid #0f172a; padding-bottom: 10px;">
            Formula Appendix
        </h1>
        <div style="column-count: 2; column-gap: 40px;">
            ${uniqueFormulas.length > 0 ? uniqueFormulas.map(f => `
                <div style="break-inside: avoid; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    <div style="font-family: monospace; font-size: 14px; font-weight: bold; color: #0f172a;">
                        ${f.replace(/\$/g, '')}
                    </div>
                </div>
            `).join('') : '<p style="color: #64748b; font-style: italic;">No specific formulas extracted from problem sets.</p>'}
        </div>
    `;
    container.appendChild(formulaPage);


    // Generate PDF
    const opt = {
        margin: 10,
        filename: `${subject.title.replace(/\s+/g, '_')}${fileSuffix}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().from(container).set(opt).save();
};
