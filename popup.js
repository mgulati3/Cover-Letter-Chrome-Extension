// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const resumeInput = document.getElementById('resumeInput');
    const jobDescriptionInput = document.getElementById('jobDescriptionInput');
    const generateBtn = document.getElementById('generateBtn');
    const coverLetterOutput = document.getElementById('coverLetterOutput');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorDisplay = document.getElementById('errorDisplay');

    // Function to display error messages
    function showError(message) {
        errorDisplay.textContent = message;
        errorDisplay.classList.remove('hidden');
    }

    // Function to hide error messages
    function hideError() {
        errorDisplay.classList.add('hidden');
        errorDisplay.textContent = '';
    }

    generateBtn.addEventListener('click', async () => {
        const resumeContent = resumeInput.value.trim();
        const jobDescriptionContent = jobDescriptionInput.value.trim();

        hideError(); // Clear previous errors
        coverLetterOutput.value = ''; // Clear previous output
        downloadBtn.classList.add('hidden'); // Hide download button

        if (!resumeContent || !jobDescriptionContent) {
            showError('Please paste both your resume and the job description.');
            return;
        }

        loadingIndicator.classList.remove('hidden');
        generateBtn.disabled = true; // Disable button during generation

        try {
            const prompt = `
            You are an expert cover letter writer.
            Based on the following resume and job description, write a compelling and personalized cover letter.
            The cover letter should:
            1. Be professional and concise.
            2. Highlight relevant skills and experiences from the resume that match the job description.
            3. Be addressed to "Hiring Manager".
            4. Have a clear opening, body paragraphs linking skills to requirements, and a strong closing.
            5. Be in plain text format, suitable for direct copy-pasting.

            --- RESUME ---
            ${resumeContent}

            --- JOB DESCRIPTION ---
            ${jobDescriptionContent}

            --- COVER LETTER ---
            `;

            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = {
                contents: chatHistory,
                generationConfig: {
                    temperature: 0.7, // Adjust for creativity vs. directness
                    maxOutputTokens: 1000 // Ensure enough length for a full letter
                }
            };

            // API key will be provided by the Canvas environment at runtime
            const apiKey = "AIzaSyCYLiE6Mx68w7cN2S9hAzVKqDOK_8rYv1o";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const coverLetter = result.candidates[0].content.parts[0].text;
                coverLetterOutput.value = coverLetter;
                downloadBtn.classList.remove('hidden'); // Show download button
            } else {
                showError('Could not generate cover letter. No valid response from AI.');
                console.error('AI response structure unexpected:', result);
            }

        } catch (error) {
            showError(`Failed to generate cover letter: ${error.message}`);
            console.error('Error generating cover letter:', error);
        } finally {
            loadingIndicator.classList.add('hidden');
            generateBtn.disabled = false; // Re-enable button
        }
    });

    downloadBtn.addEventListener('click', () => {
        const coverLetterText = coverLetterOutput.value;
        if (coverLetterText) {
            try {
                // Check if jsPDF is available
                const jsPDF = window.jsPDF || window.jspdf?.jsPDF;
                
                if (!jsPDF) {
                    throw new Error('PDF library not loaded. Please try again.');
                }

                // Initialize jsPDF
                const doc = new jsPDF();

                // Set up document properties
                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");

                // Add margins and page setup
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 20;
                const maxWidth = pageWidth - 2 * margin;
                const maxHeight = pageHeight - 2 * margin;

                // Split text into lines that fit within the page width
                const lines = doc.splitTextToSize(coverLetterText, maxWidth);
                
                // Calculate line height
                const lineHeight = 7;
                let yPosition = margin;

                // Add text to PDF with proper line spacing and page breaks
                for (let i = 0; i < lines.length; i++) {
                    // Check if we need a new page
                    if (yPosition + lineHeight > pageHeight - margin) {
                        doc.addPage();
                        yPosition = margin;
                    }
                    
                    doc.text(lines[i], margin, yPosition);
                    yPosition += lineHeight;
                }

                // Save the PDF with timestamp
                const timestamp = new Date().toISOString().slice(0, 10);
                doc.save(`cover_letter_${timestamp}.pdf`);

                // Show success message temporarily
                const originalText = errorDisplay.textContent;
                const originalClass = errorDisplay.className;
                errorDisplay.textContent = 'Cover letter downloaded successfully!';
                errorDisplay.className = 'mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md';
                errorDisplay.classList.remove('hidden');
                
                setTimeout(() => {
                    errorDisplay.textContent = originalText;
                    errorDisplay.className = originalClass;
                    errorDisplay.classList.add('hidden');
                }, 3000);
                
            } catch (error) {
                showError(`Failed to create PDF: ${error.message}`);
                console.error('PDF creation error:', error);
            }
        } else {
            showError('No cover letter to download.');
        }
    });
});