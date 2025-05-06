/**
 * Google Apps Script code for Mortgage Match Pro form submissions
 * 
 * This script handles form submissions from the Mortgage Match Pro website
 * and adds them to a Google Sheet.
 * 
 * To use:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Copy and paste this code
 * 4. Save the project
 * 5. Deploy as a web app (Deploy > New deployment > Select type > Web app)
 * 6. Set access to "Anyone" and execute as "Me"
 * 7. Copy the web app URL and use it in your form configuration
 */

// Handle incoming POST requests
function doPost(e) {
  // Set CORS headers for cross-origin requests
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Check if this is a test submission
    if (data.isTest === true) {
      // For test submissions, just return success without writing to the sheet
      return output.setContent(JSON.stringify({
        result: "success",
        message: "Test connection successful - No data was written to the sheet",
        testMode: true
      }));
    }
    
    // Get the active sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // If this is the first submission, create headers
    if (sheet.getLastRow() === 0) {
      createHeaders(sheet);
    }
    
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
    
    // Apply formatting to the sheet
    formatSheet(sheet);
    
    // Return success response
    return output.setContent(JSON.stringify({
      result: "success",
      message: "Data successfully recorded"
    }));
    
  } catch (error) {
    // Return error response
    return output.setContent(JSON.stringify({
      result: "error",
      message: error.toString()
    }));
  }
}

// Create headers for the sheet
function createHeaders(sheet) {
  const headers = [
    "Timestamp",
    "First Name",
    "Last Name",
    "Email",
    "Phone Number",
    "Lives in Maryland",
    "Works in Maryland",
    "County Employee",
    "Municipality",
    "Household Size",
    "Household Income",
    "First Time Buyer",
    "Currently Owns Property",
    "Credit Score",
    "Student Debt",
    "How Long Stay",
    "Selected Programs",
    "Qualified Programs",
    "Additional Responses"
  ];
  
  sheet.appendRow(headers);
  
  // Format header row
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.getRange(1, 1, 1, headers.length).setBackground("#f3f3f3");
  
  // Freeze the header row
  sheet.setFrozenRows(1);
}

// Apply formatting to the sheet
function formatSheet(sheet) {
  // Auto-resize columns
  sheet.autoResizeColumns(1, 19);
  
  // Format timestamp column
  const lastRow = sheet.getLastRow();
  sheet.getRange(2, 1, lastRow - 1, 1).setNumberFormat("yyyy-MM-dd HH:mm:ss");
  
  // Format income column
  sheet.getRange(2, 11, lastRow - 1, 1).setNumberFormat("$#,##0.00");
  
  // Set alternating row colors
  for (let i = 2; i <= lastRow; i++) {
    if (i % 2 === 0) {
      sheet.getRange(i, 1, 1, 19).setBackground("#ffffff");
    } else {
      sheet.getRange(i, 1, 1, 19).setBackground("#f9f9f9");
    }
  }
}

// Handle GET requests (for testing the deployment)
function doGet() {
  return HtmlService.createHtmlOutput(
    "<h2>Mortgage Match Pro - Form Handler</h2>" +
    "<p>This web app is functioning correctly.</p>" +
    "<p>This URL should be used as the endpoint for your form submissions.</p>"
  );
}