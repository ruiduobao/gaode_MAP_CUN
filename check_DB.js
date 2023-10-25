const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: 'localhost',
    port: 5434,
    database: 'postgis_34_sample',
    user: 'postgres',
    password: '12345678'
});

function checkDatabaseConnection(callback) {
    client.connect(callback);
}

const checkQuery = `
  SELECT *, ST_AsGeoJSON(geom) as geojson_geom
  FROM xian_vector."CHN_xian"
  WHERE code = $1;
`;

checkDatabaseConnection(err => {
    if (err) {
        console.error('Failed to connect to the database:', err.stack);
        client.end();
        return;
    }

    const code = 512022;
    client.query(checkQuery, [code], (err, res) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            client.end();
        } else {
            if (res.rows.length) {
                console.log(`A feature with code ${code} exists in xian_vector.CHN_xian.`);
                
                // Convert result to GeoJSON format
                const geoJSONData = {
                    type: "FeatureCollection",
                    features: res.rows.map(row => {
                        return {
                            type: "Feature",
                            properties: row,
                            geometry: JSON.parse(row.geojson_geom) // Using parsed geojson_geom column.
                        };
                    })
                };

                // Write GeoJSON data to a file
                const filePath = path.join(__dirname, 'public', 'shp', `${code}.gson`);
                fs.writeFileSync(filePath, JSON.stringify(geoJSONData, null, 2));
                console.log(`GeoJSON data saved to ${filePath}`);
            } else {
                console.log(`No feature with code ${code} found in xian_vector.CHN_xian.`);
            }

            client.end();
        }
    });
});
