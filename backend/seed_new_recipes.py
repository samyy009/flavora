import mysql.connector
import os
import json

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root@123",
    "database": "flavora",
}

def seed():
    db = mysql.connector.connect(**DB_CONFIG)
    cur = db.cursor()

    recipes = [
        # 1. Quick & Easy (and Seafood)
        (
            1, "15-Minute Garlic Butter Shrimp", "Succulent shrimp topped with parsley in a sizzling pan, garlic butter sauce.",
            json.dumps(["500g Large Shrimp", "3 tbsp Butter", "4 cloves Garlic, minced", "Fresh Parsley", "Lemon Juice"]),
            json.dumps(["Melt butter in skillet.", "Add garlic, sauté until fragrant.", "Add shrimp, cook 2 mins per side.", "Stir in lemon juice and parsley."]),
            "quick_garlic_shrimp.png", "Quick,Seafood,Keto", "quick", "15 mins", "Casual Cooking", 2
        ),
        # 2. Keto
        (
            2, "Keto-Friendly Avocado Bacon Chicken", "A juicy chicken breast topped with melted cheese, crispy bacon strips, and fresh avocado slices.",
            json.dumps(["2 Chicken Breasts", "4 slices Bacon", "1 Avocado", "1 cup Mozzarella Cheese", "Olive Oil", "Salt & Pepper"]),
            json.dumps(["Season and sear chicken breasts until golden.", "Cook bacon until crispy.", "Top chicken with bacon and cheese, broil until melted.", "Serve with fresh avocado slices."]),
            "keto_avocado_chicken.png", "Keto,High Protein", "keto", "25 mins", "Casual Cooking", 2
        ),
        # 3. Dessert
        (
            3, "Decadent Chocolate Lava Cake", "A warm chocolate cake oozing molten chocolate from the center, dusted with powdered sugar.",
            json.dumps(["1/2 cup Dark Chocolate", "1/4 cup Butter", "2 Eggs", "1/4 cup Sugar", "2 tbsp Flour", "Pinch of Salt"]),
            json.dumps(["Preheat oven to 200C. Butter ramekins.", "Melt chocolate and butter together.", "Whisk eggs and sugar, fold into chocolate.", "Add flour. Pour into ramekins and bake 10-12 mins."]),
            "dessert_lava_cake.png", "Dessert,Chocolate,Baking", "dessert", "20 mins", "Intermediate", 2
        ),
        # 4. Breakfast
        (
            4, "Fluffy Japanese Souffle Pancakes", "A tall stack of jiggly, incredibly fluffy pancakes drizzled with maple syrup.",
            json.dumps(["2 Egg Yolks", "3 Egg Whites", "1/4 cup Milk", "1/3 cup Flour", "1/4 tsp Baking Powder", "2 tbsp Sugar", "Vanilla Extract"]),
            json.dumps(["Mix yolks, milk, and vanilla. Whisk in flour and baking powder.", "Beat egg whites with sugar to stiff peaks.", "Gently fold whites into yolk mixture.", "Cook in covered pan over very low heat for 5 mins each side."]),
            "breakfast_souffle_pancakes.png", "Breakfast,Sweet,Japanese", "breakfast", "30 mins", "Advanced", 2
        ),
        # 5. Spicy
        (
            5, "Sichuan Mapo Tofu", "A vibrant red, spicy chili oil sauce with silky cubes of tofu and minced pork, garnished with fresh green scallions.",
            json.dumps(["1 block Silken Tofu", "100g Minced Pork", "2 tbsp Doubanjiang", "1 tbsp Sichuan Peppercorns", "Garlic & Ginger", "Scallions"]),
            json.dumps(["Toast and grind Sichuan peppercorns.", "Brown minced pork with garlic and ginger.", "Stir in doubanjiang and cook until oil is red.", "Add broth and tofu cubes, simmer gently. Thicken with cornstarch slurry."]),
            "spicy_mapo_tofu.png", "Spicy,Chinese,Comfort Food", "spicy", "35 mins", "Intermediate", 4
        ),
        # 6. Seafood
        (
            1, "Pan-Seared Scallops with Lemon Caper Butter", "Large, perfectly golden-brown seared scallops drizzled with lemon caper butter sauce.",
            json.dumps(["400g Large Scallops", "2 tbsp Olive Oil", "2 tbsp Butter", "1 tbsp Capers", "Lemon Juice", "Fresh Thyme"]),
            json.dumps(["Pat scallops completely dry and season with salt.", "Heat oil until smoking. Sear scallops 90 seconds per side.", "Remove scallops. In same pan, melt butter, add capers and lemon juice.", "Pour sauce over scallops."]),
            "seafood_scallops.png", "Seafood,Elegant", "seafood", "15 mins", "Intermediate", 2
        ),
        # 7. Vegan
        (
            3, "Roasted Spiced Root Vegetables", "A colorful assortment of roasted sweet potatoes, parsnips, and beets garnished with fresh herbs.",
            json.dumps(["2 Sweet Potatoes", "2 Parsnips", "2 Beets", "Olive Oil", "Cumin", "Paprika", "Fresh Thyme"]),
            json.dumps(["Preheat oven to 200C. Peel and cube all vegetables.", "Toss with olive oil, cumin, paprika, salt, and pepper.", "Roast for 40-45 minutes until tender and caramelized.", "Garnish with fresh thyme."]),
            "hero_carrots.png", "Vegan,Sides,Healthy", "vegan", "50 mins", "Beginner", 4
        )
    ]

    sql = """
        INSERT INTO recipes 
        (user_id, title, description, ingredients, steps, image, tags, diet_type, cook_time, difficulty, servings, is_draft)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0)
    """

    for r in recipes:
        cur.execute(sql, r)

    db.commit()
    print(f"Inserted {len(recipes)} recipes successfully.")
    cur.close()
    db.close()

if __name__ == "__main__":
    seed()
