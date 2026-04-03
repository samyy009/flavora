-- ============================================================
-- Flavora — Full Database Schema + Seed Data
-- Where Flavor Meets Story
-- ============================================================

DROP DATABASE IF EXISTS flavora;
CREATE DATABASE flavora;
USE flavora;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    avatar      VARCHAR(255)  DEFAULT NULL,
    bio         TEXT          DEFAULT NULL,
    phone       VARCHAR(20)   DEFAULT NULL,
    role        ENUM('user','tastemaker','admin') DEFAULT 'user',
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Recipes ──────────────────────────────────────────────────
CREATE TABLE recipes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT           NOT NULL,
    title       VARCHAR(255)  NOT NULL,
    description TEXT,
    ingredients JSON,
    steps       JSON,
    image       VARCHAR(255),
    tags        VARCHAR(500),
    diet_type   VARCHAR(100),
    cook_time   VARCHAR(50),
    difficulty  ENUM('Beginner','Casual Cooking','Intermediate','Advanced') DEFAULT 'Casual Cooking',
    servings    INT           DEFAULT 4,
    is_draft    TINYINT(1)    DEFAULT 0,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Likes ────────────────────────────────────────────────────
CREATE TABLE likes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    recipe_id   INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_like (user_id, recipe_id),
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- ── Comments ─────────────────────────────────────────────────
CREATE TABLE comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT  NOT NULL,
    recipe_id   INT  NOT NULL,
    comment     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- ── Bookmarks ────────────────────────────────────────────────
CREATE TABLE bookmarks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    recipe_id   INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_bookmark (user_id, recipe_id),
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- ── Follows ──────────────────────────────────────────────────
CREATE TABLE follows (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    follower_id  INT NOT NULL,
    following_id INT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_follow (follower_id, following_id),
    FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Password Resets ──────────────────────────────────────────
CREATE TABLE password_resets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(150),
    phone       VARCHAR(20),
    otp         VARCHAR(10)   NOT NULL,
    expires_at  TIMESTAMP     NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- ── Seed Users ───────────────────────────────────────────────
INSERT INTO users (name, email, password, bio, role) VALUES
('Clara Vigne',   'clara@flavora.com',   'hashed_pw_1', 'French Fusion chef & culinary storyteller. Paris-trained, globally inspired.',    'tastemaker'),
('Marcus Thorne', 'marcus@flavora.com',  'hashed_pw_2', 'Modern Nordic cuisine innovator. Michelin-trained home educator.',                 'tastemaker'),
('Elena Rossi',   'elena@flavora.com',   'hashed_pw_3', 'Plant-Based Food artist. Simple, seasonal, stunning.',                             'tastemaker'),
('Julien Blanc',  'julien@flavora.com',  'hashed_pw_4', 'Pastry Artist — precision is pleasure. Confection & craft.',                       'tastemaker'),
('Sameer',        'sameer@gmail.com',    '123',          'Home cook & food explorer. Learning every day.',                                   'user'),
('Admin',         'admin@flavora.com',   'admin123',     'Platform administrator.',                                                          'admin');

-- ── Seed Recipes ─────────────────────────────────────────────
INSERT INTO recipes (user_id, title, description, ingredients, steps, image, tags, diet_type, cook_time, difficulty, servings) VALUES

-- Recipe 1 by Elena Rossi (id=3)
(3, 'Braised Short Ribs with Saffron Risotto',
 'A masterclass in patience and flavour — fall-off-the-bone short ribs with a golden saffron risotto that sings.',
 '["2.5kg Bone-in Short Ribs","750ml Chianti Red Wine","4 cups Beef Stock","2 Carrots","1 Onion","2 Celery Stalks","4 cloves Garlic","1 tsp Saffron","1 cup Arborio Rice","Aged Parmigiano-Reggiano","Fresh Thyme & Rosemary","Sea Salt & Cracked Pepper"]',
 '["Season short ribs generously with salt and pepper. Sear in Dutch oven until mahogany crust develops on all sides.","Add mirepoix, deglaze with wine. Return ribs, cover with stock, braise 3 hours at low heat.","Bloom saffron in warm water. Start risotto base with shallots and arborio.","Finish risotto with cold butter and Parmesan. Plate with braised rib and reduced braising jus."]',
 'braised_ribs.png', 'Italian,Comfort Food,Seasonal', 'meat', '3.5 Hours', 'Intermediate', 4),

-- Recipe 2 by Elena Rossi (id=3)
(3, 'Spring Harvest Buddha Bowl',
 'A celebration of seasonal produce — vibrant, nourishing, and endlessly customisable.',
 '["1 cup Chickpeas (roasted)","1 Ripe Avocado","Cherry Tomatoes","Persian Cucumber","2 Soft-Boiled Eggs","Mixed Greens","Tahini Dressing","Sesame Seeds","Lemon Juice","Olive Oil"]',
 '["Roast chickpeas with cumin, smoked paprika, and salt at 200°C for 25 mins.","Arrange greens in bowl. Add cucumber, tomatoes, avocado slices.","Top with soft-boiled egg, chickpeas, sesame seeds.","Drizzle with tahini dressing. Finish with lemon juice and olive oil."]',
 'buddha_bowl.png', 'Vegan,Healthy,Bowl Food', 'vegan', '25 mins', 'Beginner', 2),

-- Recipe 3 by Clara Vigne (id=1)
(1, 'Midnight Pesto Genovese',
 'Pesto Genovese is a meditation, not a recipe. The basil must be young, the pine nuts toasted just enough.',
 '["2 cups Fresh Young Basil","3 tbsp Pine Nuts (toasted)","2 cloves Garlic","½ cup Extra Virgin Olive Oil","½ cup Aged Parmigiano","2 tbsp Pecorino Romano","Sea Salt to taste","400g Linguine"]',
 '["Toast pine nuts lightly in dry pan. Cool completely before using.","Blend basil, garlic, pine nuts with a pinch of salt until smooth.","Stream in olive oil while blending. Fold in cheeses by hand.","Cook pasta al dente. Reserve pasta water. Toss with pesto and a splash of reserved water."]',
 'pesto_pasta.png', 'Italian,Vegetarian,Quick', 'vegetarian', '35 mins', 'Intermediate', 4),

-- Recipe 4 by Marcus Thorne (id=2)
(2, 'Wood-Fired Neapolitan Pizza',
 'Our wood-fired setup reaches 480°C. That char, that leopard crust — it can only come from true Neapolitan tradition.',
 '["500g Tipo 00 Flour","325ml Water","10g Sea Salt","3g Dry Yeast","San Marzano Tomatoes","Fresh Mozzarella di Bufala","Fresh Basil Leaves","Extra Virgin Olive Oil"]',
 '["Mix flour, water, salt, yeast. Knead 10 mins. Rest 72 hours in refrigerator.","Stretch dough by hand — never a rolling pin. Shape to 30cm round.","Top with crushed tomatoes, torn mozzarella, basil.","Bake at maximum oven heat (or wood-fired) for 60-90 seconds. Drizzle with oil."]',
 'pizza.png', 'Italian,Pizza,Wood-Fired', 'vegetarian', '45 mins (+ 72h dough)', 'Intermediate', 2),

-- Recipe 5 by user Sameer (id=5)
(5, 'Heirloom Tomato & Burrata Salad',
 'The secret to these heirloom tomatoes is the temperature. Never refrigerate. Served with handmade burrata.',
 '["4 Heirloom Tomatoes (mixed colours)","250g Fresh Burrata","Fresh Basil","Smoked Sea Salt","Aged Balsamic Vinegar","Extra Virgin Olive Oil","Cracked Black Pepper"]',
 '["Bring tomatoes to room temperature 1 hour before serving.","Slice tomatoes. Arrange on plate alternating colours.","Tear burrata over tomatoes. Season with smoked salt and pepper.","Drizzle with quality olive oil and aged balsamic. Garnish with basil."]',
 'tomato_burrata.png', 'Salad,Italian,No-Cook', 'vegetarian', '15 mins', 'Beginner', 2),

-- Recipe 6 by Clara Vigne (id=1)
(1, 'Slow-Roasted Heirloom Carrots with Whipped Tahini',
 'A masterclass in texture and seasonal simplicity. Root vegetables deserve more respect.',
 '["800g Heirloom Carrots (mixed)","3 tbsp Olive Oil","1 tsp Cumin Seeds","½ tsp Smoked Paprika","200g Tahini","2 tbsp Lemon Juice","1 clove Garlic","Ice Water","Fresh Dill","Pomegranate Seeds"]',
 '["Toss carrots with olive oil, cumin, paprika. Roast at 180°C for 45 mins until caramelised.","Blend tahini with lemon juice, garlic, and ice water until smooth and fluffy.","Spread tahini on plate. Arrange roasted carrots.","Garnish with pomegranate seeds, fresh dill, and drizzle of olive oil."]',
 'hero_carrots.png', 'Vegan,Seasonal,Roasted', 'vegan', '55 mins', 'Beginner', 4),

-- Recipe 7 by Elena Rossi (id=3)
(3, 'Spring Herb Risotto',
 'Creamy, verdant, and alive with spring herbs. A vegan risotto that proves you do not need butter or cheese.',
 '["1.5 cups Arborio Rice","1 Shallot","3 cups Vegetable Stock","½ cup Dry White Wine","1 cup Pea Shoots","Fresh Asparagus","Chives & Flat-Leaf Parsley","3 tbsp Vegan Butter","Vegan Parmesan","Lemon Zest"]',
 '["Warm stock in separate pan. Sweat shallot in olive oil until soft.","Toast arborio 2 mins. Deglaze with white wine.","Add warm stock ladle by ladle, stirring constantly. 18 mins total.","Stir in vegan butter, asparagus, pea shoots. Finish with lemon zest and vegan parmesan."]',
 'hero_carrots.png', 'Vegan,Risotto,Spring', 'vegan', '35 mins', 'Intermediate', 4);

-- ── Seed Likes ───────────────────────────────────────────────
INSERT INTO likes (user_id, recipe_id) VALUES
(5,1),(5,2),(5,4),(5,6),
(1,2),(1,3),(1,7),
(2,1),(2,3),(2,5),(2,6),
(3,4),(3,5),
(4,1),(4,2),(4,3),(4,4);

-- ── Seed Comments ────────────────────────────────────────────
INSERT INTO comments (user_id, recipe_id, comment) VALUES
(5, 1, 'The saffron tip is golden! I bloomed mine in a little warm chicken stock — incredible depth of flavour.'),
(2, 1, 'Adding this to my cooking class curriculum. Students will love the technique breakdown.'),
(4, 1, 'Made this on Sunday. The braise took 4 hours but worth every minute. Family was speechless.'),
(5, 2, 'The roasted chickpea crunch makes this bowl! Added some harissa on the side.'),
(1, 2, 'What tahini brand do you use, Elena? The dressing is beautifully smooth.'),
(5, 3, 'Best pesto I have ever made at home. The toasted pine nut tip changes everything.'),
(3, 4, 'That 72-hour dough is the real secret. The depth of flavour is unreal.'),
(5, 4, 'Made this in my home oven at 280°C. Not quite 480 but the result was still incredible!'),
(2, 5, 'So simple but so perfect. Quality ingredients really shine here.'),
(1, 6, 'The whipped tahini technique is something I use in my French kitchen now. Merci!'),
(5, 7, 'Proving that vegan food can be just as luxurious. This risotto is pure comfort.');

-- ── Seed Bookmarks ───────────────────────────────────────────
INSERT INTO bookmarks (user_id, recipe_id) VALUES
(5,1),(5,3),(5,6),
(1,4),(1,6),
(2,1),(2,6),
(4,2),(4,7);

-- ── Seed Follows ─────────────────────────────────────────────
INSERT INTO follows (follower_id, following_id) VALUES
(5,1),(5,2),(5,3),(5,4),
(1,3),(1,2),
(2,1),(2,3),
(4,1),(4,3);
