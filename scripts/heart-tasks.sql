-- Add H.E.A.R.T. Service Model Tasks
INSERT INTO tasks (name, description, category, armadollars) VALUES
-- H - Howdy Tasks
('Greet guest within 15 seconds', 'Welcome guests with energy, friendliness, and fun within 15-45 seconds', 'howdy', 10),
('Enthusiastic greeting', 'Give an energetic and memorable first impression', 'howdy', 5),
('Fun interaction with guest', 'Make guests smile during initial greeting', 'howdy', 8),

-- E - Engage Tasks  
('Take drink order within 2 minutes', 'Serve drinks and take orders within 2-3 minutes with knowledge and passion', 'engage', 15),
('Showcase menu knowledge', 'Demonstrate expertise about menu items and specials', 'engage', 12),
('Passionate food recommendation', 'Show genuine care in helping guests choose their meal', 'engage', 10),

-- A - Arrive Tasks
('Deliver appetizers in 6-8 minutes', 'Ensure appetizers arrive hot and fresh within timing standards', 'arrive', 20),
('Deliver salads in 5 minutes', 'Get fresh salads to the table quickly', 'arrive', 15),
('Deliver entrées in 12-15 minutes', 'Ensure main courses arrive perfectly timed and presented', 'arrive', 25),
('Attentive table presence', 'Show pride and attentiveness during food delivery', 'arrive', 8),

-- R - Respond Tasks
('Fulfill guest request promptly', 'Handle guest needs with kindness, courtesy, and respect', 'respond', 12),
('Maintain clean table area', 'Keep tables organized and presentable throughout service', 'respond', 8),
('Refill drinks without being asked', 'Anticipate guest needs proactively', 'respond', 10),
('Handle complaint with grace', 'Turn a negative experience into a positive one', 'respond', 30),

-- T - Thank You Tasks
('Memorable farewell', 'End the dining experience with genuine gratitude', 'thankyou', 10),
('Invite guests to return', 'Make guests feel welcome to come back', 'thankyou', 8),
('Walk guests to door', 'Go above and beyond in showing appreciation', 'thankyou', 15),

-- Texas Roadhouse Signature Tasks
('Hand-cut steak perfection', 'Ensure steak is cooked exactly to guest preference', 'signature', 25),
('Fresh bread delivery', 'Serve warm, fresh-baked bread with cinnamon butter', 'signature', 5),
('Legendary margarita service', 'Craft and serve our famous margaritas', 'signature', 15),
('Fall-off-the-bone ribs', 'Ensure ribs meet our legendary standards', 'signature', 20),
('Ice-cold beer service', 'Serve beer at perfect temperature', 'signature', 8),
('Made-from-scratch sides', 'Prepare and serve our signature side dishes', 'signature', 12)

ON CONFLICT (name) DO NOTHING;

-- Update existing tasks to use new categories
UPDATE tasks SET category = 'howdy' WHERE name ILIKE '%greet%';
UPDATE tasks SET category = 'engage' WHERE name ILIKE '%upsell%';
UPDATE tasks SET category = 'respond' WHERE name ILIKE '%clean%' OR name ILIKE '%help%';
UPDATE tasks SET category = 'signature' WHERE name ILIKE '%accuracy%';
