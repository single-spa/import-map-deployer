const fetch = require("node-fetch");

async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(process.env.HASURA_URL, {
    method: "POST",
    body: JSON.stringify({
      query: operationsDoc,
      variables: variables,
      operationName: operationName,
    }),
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_SECRET,
    },
  });

  return await result.json();
}

const insertMfeServiceQuery = `mutation InsertMfeService ($arg: mfe_services_versions_insert_input!) {
  insert_mfe_services_versions_one(
    object: $arg
    on_conflict: {
      constraint: mfe_services_versions_pkey
      update_columns: [deployed_at, rollback_at]
    }
  ) {
    id
    created_at
    deployed_at
    environment
    link
    organization
    rollback_at
    service_name
    squad_name
    version
    type
  }
}`;

const insertMfeImportmapQuery = `mutation InsertMfeImportmap ($arg: mfe_import_map_versions_insert_input!) {
  insert_mfe_import_map_versions_one(
    object: $arg
    on_conflict: {
        constraint: mfe_import_map_versions_pkey
        update_columns: [deployed_at]
      }
  ) {
      id
    }
  }`;

function insertQuery(query, params, operationName) {
  return fetchGraphQL(query, operationName, params);
}

async function addDeployVersion(params) {
  const { errors, data } = await insertQuery(
    insertMfeServiceQuery,
    { arg: JSON.parse(JSON.stringify(params)) },
    "InsertMfeService"
  );
  if (errors) {
    // handle those errors like a pro
    console.error(errors);
  }

  // do something great with this precious data
  return data;
}

async function addImportmapVersion(params) {
  const { errors, data } = await insertQuery(
    insertMfeImportmapQuery,
    { arg: params },
    "InsertMfeImportmap"
  );
  if (errors) {
    // handle those errors like a pro
    console.error(errors);
  }

  // do something great with this precious data
  return data;
}

module.exports = {
  addDeployVersion,
  addImportmapVersion,
};
