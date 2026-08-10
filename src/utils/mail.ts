// Import Nodemailer.
// Nodemailer is used to send emails from the Node.js application.
import nodemailer from "nodemailer";

// Import dotenv.
// dotenv loads variables from the .env file into process.env.
import dotenv from "dotenv";

// Load environment variables from the .env file.
dotenv.config();

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS ? "LOADED" : "MISSING"
);

// Create a Nodemailer transporter.
// The transporter is responsible for connecting to Gmail
// and sending emails using the credentials provided below.
const transporter = nodemailer.createTransport({
  // Tell Nodemailer that we are using Gmail as the email service.
  service: "gmail",

  // Gmail authentication details.
  // These values are taken from the .env file.
  auth: {
    // Gmail address from the EMAIL_USER environment variable.
    user: process.env.EMAIL_USER,

    // Gmail App Password from the EMAIL_PASS environment variable.
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send an email after a user's event booking is confirmed.
//
// Parameters:
// userEmail   -> Email address of the user.
// userName    -> Name of the user.
// eventTitle  -> Name/title of the booked event.
// text        -> Additional message that should be included in the email.
export const sendBookingEmail = async (
  userEmail: string,
  userName: string,
  eventTitle: string,
  text: string,
) => {
  try {
    // Create the email details.
    const mailOptions = {
      // Email address from which the email will be sent.
      from: process.env.EMAIL_USER,

      // Email address of the person receiving the email.
      to: userEmail,

      // Subject of the booking confirmation email.
      subject: `Booking confirmed: ${eventTitle}`,

      // Actual content/body of the email.
      text: `Hello ${userName},

Your booking for the event "${eventTitle}" has been successfully confirmed.

${text}

Regards,
Eventora`,
    };

    // Send the email using the Nodemailer transporter.
    await transporter.sendMail(mailOptions);

    // Print a success message in the terminal.
    console.log(`Booking email sent to ${userEmail} successfully.`);
  } catch (error) {
    // If sending the email fails, print the error in the terminal.
    console.error(`Error sending booking email to ${userEmail}:`, error);

    // Throw the error again so the controller that called this function
    // knows that the email sending operation failed.
    throw error;
  }
};

// Function to send an OTP email to a user's email address.
//
// Parameters:
// email -> User's email address.
// otp   -> One-time password generated for verification.
// type  -> Purpose of the OTP, for example "registration" or "login".
// text  -> Additional message to include in the email.
export const sendAccountEmail = async (
  email: string,
  otp: string,
  type: string,
  text: string,
) => {
  try {
    // Create the email details.
    const mailOptions = {
      // Email address from which the OTP email will be sent.
      from: process.env.EMAIL_USER,

      // Email address of the user receiving the OTP.
      to: email,

      // Subject of the OTP email.
      subject: `OTP for ${type}`,

      // Actual content/body of the OTP email.
      text: `Your OTP is ${otp} for ${type}.

This OTP will expire in 3 minutes.

${text}

Regards,
Eventora`,
    };

    // Send the OTP email through Gmail.
    await transporter.sendMail(mailOptions);

    // Print a success message in the terminal.
    console.log(`Email sent to ${email} for ${type} successfully.`);
  } catch (error) {
    // If sending the email fails, print the error.
    console.error(`Error sending account email to ${email}:`, error);

    // Pass the error back to the controller.
    throw error;
  }
};

// Export both email functions as the default export.
// This allows another file to import both functions from this file.
export default {
  sendBookingEmail,
  sendAccountEmail,
};