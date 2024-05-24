CREATE TABLE IF NOT EXISTS person (
    name TEXT NOT NULL,
    email TEXT PRIMARY KEY,
    team TEXT,
    level INTEGER,
    manager TEXT,
    rateable BOOLEAN,
    active BOOLEAN
);

CREATE TABLE IF NOT EXISTS person_group (
    email TEXT NOT NULL,
    group_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS axis (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    reference_points jsonb,
    creator TEXT,
    active BOOLEAN
);

CREATE TABLE IF NOT EXISTS axis_audience (
    axis_id INTEGER,
    applicability TEXT
);

CREATE TABLE IF NOT EXISTS rating (
    id SERIAL PRIMARY KEY,
    date_time TEXT NOT NULL,
    rater TEXT NOT NULL,
    ratee TEXT NOT NULL,
    comment TEXT,
    share_with_ratee BOOLEAN,
    acknowledged_by_ratee BOOLEAN,
    ratee_comment TEXT,
    lm_comment TEXT,
    active BOOLEAN
);

CREATE TABLE IF NOT EXISTS rating_score (
    rating_id INTEGER NOT NULL,
    axis_id INTEGER NOT NULL,
    score DOUBLE PRECISION NOT NULL
);