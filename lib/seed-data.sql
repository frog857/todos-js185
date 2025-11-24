INSERT INTO todolists (title)
VALUES ('Work Todos'), ('Home Todos'),
('Additional Todos'), ('Social Todos');

INSERT INTO todos (title, done, todolist_id)
VALUES ('Get Coffee', true, 1),
('Chat with co-workers', true, 1),
('Duck out of meeting', DEFAULT, 1),
('Feed the cats', true, 2),
('Go to bed', true, 2),
('Buy Milk', true, 2),
('Study for LS', true, 2),
('Go to Libby''s birthday party', false, 4);
