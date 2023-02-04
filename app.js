const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
app.use(express.json());

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObjectSt = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

const convertDbObjectToResponseObjectDistrict = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
app.get("/states/", async (request, response) => {
  const getstatesQuery = `
    SELECT
      *
    FROM
      state
    ORDER BY
      state_id;`;

  const stateArray = await db.all(getstatesQuery);
  response.send(
    stateArray.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM 
    state
    WHERE 
    state_id=${stateId};`;
  const state = await db.get(getStateQuery);

  response.send(convertDbObjectToResponseObject(state));
});

//API 3

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const adddistrictQuery = `
  INSERT INTO
      district (district_name,state_Id,cases,cured,active,deaths )
    VALUES
      (
         
         '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
         
         )
      
        ;`;
  const dbResponse = await db.run(adddistrictQuery);
  const districtId = dbResponse.lastID; //create primary key

  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM 
    district
    WHERE 
    district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);

  response.send(convertDbObjectToResponseObjectDistrict(district));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId};`;

  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//APi 6 no

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails1 = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails1;

  const updateDistrictQuery1 = `
    UPDATE
      district
    SET
      district_name='${districtName}',
        state_id= ${stateId},
        cases= ${cases},
         cured=${cured},
         active=${active},
         deaths=${deaths}

    WHERE
      district_id = ${districtId};`;

  await db.run(updateDistrictQuery1);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStateSumQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district
    
    WHERE state_id=${stateId};`;

  const stats = await db.get(getStateSumQuery);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//APi 8

app.get("districts/:districtId/details/", async (request, reponse) => {
  const { districtId } = request.params;
  const getDistrictDeatils = `
    SELECT state_name
    FROM district
    WHERE district_id=${districtId};`;

  const details = await db.all(getDistrictDeatils);
  response.send(convertDbObjectToResponseObjectSt(details));
});

module.exports = app;
