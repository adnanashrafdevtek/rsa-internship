// sendEmail.js — using Google Apps Script web app endpoint (Option 2)

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_lLSugpX-DX1Ms-ZEHE9v1z8m8nL7uTJQwMfCV1ycyZhnHp8FGsmJVhgEL4v4x7UH/exec"; 
// ^ replace this with your deployed Google Apps Script web app URL

export const sendWelcomeEmail = async (user) => {
  const emailData = {
    firstName: user.firstName,
    username: user.username,
    role: user.role,
    email: user.email,
  };

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Google Apps Script doesn’t return CORS headers
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    console.log(`Email sent to ${user.email}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};
