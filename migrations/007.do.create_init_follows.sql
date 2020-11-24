CREATE TABLE init_follows (
    notification_id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    date_created TIMESTAMP DEFAULT now() NOT NULL,
    username TEXT NOT NULL
        REFERENCES user_information(username) ON DELETE CASCADE,
    user_id INTEGER NOT NULL
        REFERENCES _information(id) ON DELETE CASCADE,
    followed_id TEXT NOT NULL ,
    activity_message VARCHAR NOT NULL,
    unread BOOLEAN DEFAULT true NOT NULL
);