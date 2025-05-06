# Mortgage Match Pro API

This API provides access to homebuyer program information across Maryland counties.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Navigate to the API directory
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Programs

#### Get All Programs

Returns a list of all available loan programs.

- **URL:** `/api/programs`
- **Method:** `GET`
- **Success Response:**
  - **Code:** 200
  - **Content:** Array of program objects

#### Get Program by ID

Returns a specific program by its ID.

- **URL:** `/api/programs/:id`
- **Method:** `GET`
- **URL Parameters:**
  - `id=[string]` - ID of the program
- **Success Response:**
  - **Code:** 200
  - **Content:** Program object
- **Error Response:**
  - **Code:** 404
  - **Content:** `{ "error": "Program not found" }`

#### Search Programs

Searches programs based on various criteria.

- **URL:** `/api/programs/search`
- **Method:** `POST`
- **Data Parameters:**
  ```json
  {
    "county": "string", // optional - county name or "any"
    "city": "string", // optional - city name or "any"
    "firstTimeBuyer": boolean, // optional
    "creditScore": number, // optional - minimum credit score
    "income": number, // optional - annual household income
    "householdSize": number // optional - household size (1-5+)
  }
  ```
- **Success Response:**
  - **Code:** 200
  - **Content:** Array of matching program objects

#### Add a New Program

Adds a new loan program to the database.

- **URL:** `/api/programs`
- **Method:** `POST`
- **Data Parameters:** Complete program object
- **Success Response:**
  - **Code:** 201
  - **Content:** Created program object

#### Update a Program

Updates an existing program.

- **URL:** `/api/programs/:id`
- **Method:** `PUT`
- **URL Parameters:**
  - `id=[string]` - ID of the program to update
- **Data Parameters:** Complete program object
- **Success Response:**
  - **Code:** 200
  - **Content:** Updated program object
- **Error Response:**
  - **Code:** 404
  - **Content:** `{ "error": "Program not found" }`

#### Delete a Program

Deletes a program.

- **URL:** `/api/programs/:id`
- **Method:** `DELETE`
- **URL Parameters:**
  - `id=[string]` - ID of the program to delete
- **Success Response:**
  - **Code:** 204
  - **Content:** No content
- **Error Response:**
  - **Code:** 404
  - **Content:** `{ "error": "Program not found" }`

### Location Data

#### Get All Counties

Returns a list of all counties with loan programs.

- **URL:** `/api/counties`
- **Method:** `GET`
- **Success Response:**
  - **Code:** 200
  - **Content:** Array of county names

#### Get Cities for a County

Returns all cities in a specific county that have loan programs.

- **URL:** `/api/counties/:county/cities`
- **Method:** `GET`
- **URL Parameters:**
  - `county=[string]` - County name
- **Success Response:**
  - **Code:** 200
  - **Content:** Array of city names

## Data Models

### Program Object

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "savings": "string",
  "eligibility": {
    "firstTimeBuyer": boolean,
    "creditScore": number,
    "livingInCounty": boolean,
    "workingInCounty": boolean,
    "countyEmployee": boolean,
    "currentlyOwnProperty": boolean,
    "counties": ["string"],
    "cities": ["string"],
    "incomeLimits": {
      "1": number,
      "2": number,
      "3": number,
      "4": number,
      "5": number
    }
  },
  "benefits": ["string"],
  "requirements": ["string"],
  "links": [
    {
      "title": "string",
      "url": "string"
    }
  ],
  "lastUpdated": "string"
}
```

## Error Handling

All endpoints will return appropriate error codes:

- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Server Error

Error responses will include an error message:

```json
{
  "error": "Error message description"
}
```

## Examples

### Search for Programs in Montgomery County

```bash
curl -X POST http://localhost:3000/api/programs/search \
  -H "Content-Type: application/json" \
  -d '{"county": "montgomery", "firstTimeBuyer": true}'
```

### Get All Available Counties

```bash
curl http://localhost:3000/api/counties
```