#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"

echo Resetting the data in the test database

for csv_file in $DIR/example-data/*.csv
do
    table=$(basename "${csv_file%.csv}")

    # Get the first line of the CSV file and extract column names
    column_names=$(head -n 1 $csv_file)

    psql -q -d ${DB_NAME}_test << EOF
        -- Empty table before loading data
        TRUNCATE TABLE ${table};

        -- Load data into $table table with extracted column names
        \copy ${table}($column_names) FROM '$csv_file' WITH CSV HEADER;
EOF
done

>/dev/null psql -q -d ${DB_NAME}_test << EOF
    select setval(pg_get_serial_sequence('axis', 'id'), max(id)) from axis;
    select setval(pg_get_serial_sequence('rating', 'id'), max(id)) from rating;
EOF