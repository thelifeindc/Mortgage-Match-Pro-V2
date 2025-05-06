# How to Set Up Google Sheets Integration

Follow these steps to connect your Mortgage Match Pro form with Google Sheets:

## Step 1: Create a New Google Sheet

1. Go to [Google Drive](https://drive.google.com/) and sign in with your Google account
2. Click on "New" > "Google Sheets"
3. Rename the sheet to "Mortgage Match Pro - Form Submissions"
4. Create the following column headers in row 1:
   - Timestamp
   - First Name
   - Last Name
   - Email
   - Phone Number
   - Lives in Maryland
   - Works in Maryland
   - County Employee
   - Municipality
   - Household Size
   - Household Income
   - First Time Buyer
   - Currently Owns Property
   - Credit Score
   - Student Debt
   - How Long Stay
   - Selected Programs
   - Qualified Programs
   - Additional Responses

## Step 2: Create a Google Apps Script

1. In your Google Sheet, click on "Extensions" > "Apps Script"
2. Delete any code in the editor and replace it with the following:

```javascript
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Format the selected programs and qualified programs as strings
    const selectedPrograms = data.selectedPrograms.join(", ");
    const qualifiedPrograms = data.qualifiedPrograms.join(", ");
    
    // Format additional responses as a string
    let additionalResponsesString = "";
    for (const key in data.additionalResponses) {
      if (data.additionalResponses.hasOwnProperty(key)) {
        const response = data.additionalResponses[key];
        additionalResponsesString += `${response.question}: ${response.answer}; `;
      }
    }
    
    // Prepare the row data
    const rowData = [
      new Date(), // Timestamp
      data.firstName,
      data.lastName,
      data.email,
      data.phoneNumber,
      data.liveInCounty ? "Yes" : "No",
      data.workInCounty ? "Yes" : "No",
      data.countyEmployee ? "Yes" : "No",
      data.municipality,
      data.householdSize,
      data.householdIncome,
      data.firstTimeBuyer ? "Yes" : "No",
      data.currentlyOwnProperty ? "Yes" : "No",
      data.creditScore,
      data.studentDebt ? "Yes" : "No",
      data.howLongStay,
      selectedPrograms,
      qualifiedPrograms,
      additionalResponsesString
    ];
    
    // Append the data to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      message: "Data successfully recorded"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click on "Save" and name the project "Mortgage Match Pro Form Handler"

## Step 3: Deploy the Web App

1. Click on "Deploy" > "New deployment"
2. Click the gear icon next to "Select type" and choose "Web app"
3. Enter the following details:
   - Description: "Mortgage Match Pro Form Handler"
   - Execute as: "Me (your email)"
   - Who has access: "Anyone" (this allows your form to submit data without requiring user login)
4. Click "Deploy"
5. Copy the Web app URL that appears (it will look like `https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxx/exec`)
6. Click "Done"

## Step 4: Update Your Website's Form Submission URL

Update the URL in your form-handlers.js file with the new Web app URL you copied:

```javascript
// Line 593 in form-handlers.js
fetch(
    "YOUR_NEW_GOOGLE_APPS_SCRIPT_URL_HERE",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
    }
)
```

## Important Security Notes:

1. The Google Apps Script is deployed to run as your account, so any data collected will be accessible to you.
2. The script is set to be accessible by "Anyone" which means any request to the URL can execute the script. This is necessary for your form to submit data without requiring users to be logged in to Google.
3. Google Apps Script has quotas and limitations:
   - The script has a maximum execution time of 6 minutes
   - There are daily quotas for the number of executions
   - For high-traffic websites, consider implementing a more robust backend solution

## Testing Your Integration:

1. After updating the form-handlers.js file with your new URL, test the form by filling it out and clicking "Submit Information" on the final page.
2. Check your Google Sheet to verify that the data was correctly recorded.
3. If there are issues, check the browser console for any error messages.

## Troubleshooting:

If your form submissions aren't working:

1. Make sure CORS is enabled in your Google Apps Script by adding these lines at the top of your doPost function:
   ```javascript
   function doPost(e) {
     // Set CORS headers
     const output = ContentService.createTextOutput();
     output.setMimeType(ContentService.MimeType.JSON);
     
     // Rest of your function...
   ```

2. Check that your web app is properly deployed and accessible
3. Verify that the URL in your form-handlers.js file matches the deployed web app URL
4. Check the browser console for any error messages during form submission