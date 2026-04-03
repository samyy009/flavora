from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling
import os
import json
from datetime import datetime, timedelta
import random
from flask_mail import Mail, Message

from flask_mail import Mail, Message
from dotenv import load_dotenv

# ── App Init ─────────────────────────────────────────────────
load_dotenv() # Load .env file

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", "flavora_secret_2024_zx9k")
CORS(app, supports_credentials=True, origins=[
    "http://localhost:8080", 
    "http://127.0.0.1:8080",
    os.environ.get("FRONTEND_URL", "*") # Support for your new domain
])

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ── Mail Config (Real OTP) ───────────────────────────────────
app.config['MAIL_SERVER']   = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
app.config['MAIL_PORT']     = int(os.environ.get("MAIL_PORT", 587))
app.config['MAIL_USE_TLS']  = os.environ.get("MAIL_USE_TLS", "True") == "True"
app.config['MAIL_USERNAME'] = os.environ.get("MAIL_USERNAME", "flavora.app@gmail.com")
app.config['MAIL_PASSWORD'] = os.environ.get("MAIL_PASSWORD", "your-app-password")
app.config['MAIL_DEFAULT_SENDER'] = app.config['MAIL_USERNAME']
mail = Mail(app)

# ── DB Config ────────────────────────────────────────────────
DB_CONFIG = {
    "host":     os.environ.get("DB_HOST", "localhost"),
    "user":     os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASS", "root@123"),
    "database": os.environ.get("DB_NAME", "flavora"),
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

def query(sql, params=(), one=False, commit=False):
    db = None
    try:
        db = get_db()
        cur = db.cursor(dictionary=True)
        cur.execute(sql, params)
        if commit:
            db.commit()
            result = cur.lastrowid
        elif one:
            result = cur.fetchone()
        else:
            result = cur.fetchall()
        cur.close()
        return result
    except mysql.connector.Error as e:
        print(f"[DB ERROR] {e}")
        raise
    finally:
        if db and db.is_connected():
            db.close()

# ── Auth ──────────────────────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def register():
    d = request.json or {}
    if not d.get('email') or not d.get('password') or not d.get('name'):
        return jsonify({"error": "name, email and password are required"}), 400
    try:
        existing = query("SELECT id FROM users WHERE email=%s", (d['email'],), one=True)
        if existing:
            return jsonify({"error": "Email already registered"}), 409
        uid = query(
            "INSERT INTO users (name, email, password, bio) VALUES (%s,%s,%s,%s)",
            (d['name'], d['email'], d['password'], d.get('bio', '')), commit=True
        )
        session['user_id'] = uid
        return jsonify({"id": uid, "name": d['name'], "email": d['email'], "role": "user"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.json or {}
    try:
        user = query(
            "SELECT id,name,email,avatar,bio,role FROM users WHERE email=%s AND password=%s",
            (d.get('email',''), d.get('password','')), one=True
        )
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
        session['user_id'] = user['id']
        return jsonify(user)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

@app.route('/api/auth/me', methods=['GET'])
def me():
    uid = session.get('user_id')
    if not uid:
        return jsonify({"error": "Not authenticated"}), 401
    user = query("SELECT id,name,email,avatar,bio,role,phone FROM users WHERE id=%s", (uid,), one=True)
    return jsonify(user)

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    d = request.json or {}
    target = d.get('target', '').strip() # Can be email or phone
    if not target:
        return jsonify({"error": "Email or Phone required"}), 400

    # 1. Check if user exists
    user = query("SELECT id, name, email, phone FROM users WHERE email=%s OR phone=%s", (target, target), one=True)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # 2. Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    expiry = datetime.now() + timedelta(minutes=10)

    # 3. Store OTP
    query("DELETE FROM password_resets WHERE email=%s OR phone=%s", (user['email'], user['phone']), commit=True)
    query("INSERT INTO password_resets (email, phone, otp, expires_at) VALUES (%s,%s,%s,%s)",
          (user['email'], user['phone'], otp, expiry), commit=True)

    # 4. Send OTP (Real delivery)
    try:
        is_phone = (target == user.get('phone'))
        if is_phone:
            # TWILIO placeholder — you can add your account_sid and auth_token here
            print(f"[SMS OTP TO {target}] Your Flavora code is {otp}")
            # Mock success for phone if no Twilio config
            return jsonify({"message": f"OTP sent to your phone {target}"})
        else:
            msg = Message("Your Flavora Reset Code", recipients=[user['email']])
            msg.body = f"Hello {user['name']},\n\nYour 6-digit password reset code is: {otp}\n\nThis code expires in 10 minutes."
            mail.send(msg)
            return jsonify({"message": f"OTP sent to {user['email']}"})
    except Exception as e:
        print(f"[MAIL ERROR] {e}")
        # Fallback to console during development if SMTP fails
        print(f"\n>>> DEVELOPMENT OTP FOR {target}: {otp} <<<\n")
        return jsonify({"message": "OTP generated (see console)", "dev_otp": otp})

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    d = request.json or {}
    target   = d.get('target', '')
    otp      = d.get('otp', '')
    new_pass = d.get('password', '')

    if not target or not otp or not new_pass:
        return jsonify({"error": "All fields required"}), 400

    # 1. Verify OTP
    record = query("SELECT * FROM password_resets WHERE (email=%s OR phone=%s) AND otp=%s",
                  (target, target, otp), one=True)
    if not record:
        return jsonify({"error": "Invalid or expired OTP"}), 401

    if datetime.now() > record['expires_at']:
        return jsonify({"error": "OTP has expired"}), 401

    # 2. Update Password
    query("UPDATE users SET password=%s WHERE email=%s OR phone=%s",
          (new_pass, record['email'], record['phone']), commit=True)

    # 3. Cleanup unused OTPs
    query("DELETE FROM password_resets WHERE email=%s OR phone=%s", (record['email'], record['phone']), commit=True)

    return jsonify({"message": "Password updated successfully"})

@app.route('/api/users/me', methods=['PATCH'])
def update_profile():
    uid = session.get('user_id')
    if not uid: return jsonify({"error": "Login required"}), 401

    d = request.json or {}
    name  = d.get('name')
    bio   = d.get('bio')
    phone = d.get('phone')
    avatar = d.get('avatar')

    updates = []
    params = []
    if name:  updates.append("name=%s");  params.append(name)
    if bio:   updates.append("bio=%s");   params.append(bio)
    if phone: updates.append("phone=%s"); params.append(phone)
    if avatar: updates.append("avatar=%s"); params.append(avatar)

    if not updates:
        return jsonify({"error": "No changes provided"}), 400

    params.append(uid)
    query(f"UPDATE users SET {', '.join(updates)} WHERE id=%s", tuple(params), commit=True)

    user = query("SELECT id,name,email,avatar,bio,role,phone FROM users WHERE id=%s", (uid,), one=True)
    return jsonify(user)

# ── Admin Stats ───────────────────────────────────────────────
@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    try:
        users_count     = query("SELECT COUNT(*) AS c FROM users WHERE role != 'admin'",   one=True)['c']
        recipes_count   = query("SELECT COUNT(*) AS c FROM recipes WHERE is_draft=0",       one=True)['c']
        likes_count     = query("SELECT COUNT(*) AS c FROM likes",                           one=True)['c']
        comments_count  = query("SELECT COUNT(*) AS c FROM comments",                        one=True)['c']
        bookmarks_count = query("SELECT COUNT(*) AS c FROM bookmarks",                       one=True)['c']
        follows_count   = query("SELECT COUNT(*) AS c FROM follows",                         one=True)['c']
        tastemakers     = query("SELECT COUNT(*) AS c FROM users WHERE role='tastemaker'",   one=True)['c']

        top_recipes = query("""
            SELECT r.title, COUNT(l.id) AS like_count
            FROM recipes r LEFT JOIN likes l ON l.recipe_id=r.id
            WHERE r.is_draft=0
            GROUP BY r.id ORDER BY like_count DESC LIMIT 5
        """)

        recent_comments = query("""
            SELECT c.comment, u.name AS user, r.title AS recipe, c.created_at
            FROM comments c
            JOIN users u ON c.user_id=u.id
            JOIN recipes r ON c.recipe_id=r.id
            ORDER BY c.created_at DESC LIMIT 8
        """)

        all_users = query("""
            SELECT u.id, u.name, u.email, u.role, u.created_at,
                   (SELECT COUNT(*) FROM recipes  WHERE user_id=u.id AND is_draft=0) AS recipes,
                   (SELECT COUNT(*) FROM follows  WHERE following_id=u.id)            AS followers
            FROM users u ORDER BY u.created_at ASC
        """)

        return jsonify({
            "stats": {
                "users":      users_count,
                "recipes":    recipes_count,
                "likes":      likes_count,
                "comments":   comments_count,
                "bookmarks":  bookmarks_count,
                "follows":    follows_count,
                "tastemakers":tastemakers,
            },
            "top_recipes":     top_recipes,
            "recent_comments": recent_comments,
            "users":           all_users,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Recipes ───────────────────────────────────────────────────
@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    diet    = request.args.get('diet')
    limit   = int(request.args.get('limit', 20))
    offset  = int(request.args.get('offset', 0))
    exclude = request.args.get('exclude', 0)
    user_id = request.args.get('user_id')
    q       = request.args.get('q', '').strip()
    uid     = session.get('user_id', 0)

    sql = """
        SELECT r.*,
               u.name AS author_name, u.avatar AS author_avatar,
               (SELECT COUNT(*) FROM likes    l WHERE l.recipe_id = r.id) AS like_count,
               (SELECT COUNT(*) FROM comments c WHERE c.recipe_id = r.id) AS comment_count,
               (SELECT COUNT(*) FROM likes    l WHERE l.recipe_id = r.id AND l.user_id = %s) AS user_liked,
               (SELECT COUNT(*) FROM bookmarks b WHERE b.recipe_id = r.id AND b.user_id = %s) AS user_bookmarked
        FROM recipes r
        JOIN users u ON r.user_id = u.id
        WHERE r.is_draft = 0
    """
    params = [uid, uid]
    if diet:
        sql += " AND r.diet_type = %s"; params.append(diet)
    if exclude:
        sql += " AND r.id != %s"; params.append(exclude)
    if user_id:
        sql += " AND r.user_id = %s"; params.append(user_id)
    if q:
        sql += " AND (r.title LIKE %s OR r.description LIKE %s OR r.tags LIKE %s)"
        like_q = f"%{q}%"
        params += [like_q, like_q, like_q]
    sql += " ORDER BY r.created_at DESC LIMIT %s OFFSET %s"
    params += [limit, offset]

    try:
        recipes = query(sql, params)
        for r in recipes:
            for f in ('ingredients', 'steps'):
                if r.get(f) and isinstance(r[f], str):
                    try: r[f] = json.loads(r[f])
                    except: pass
            # Always set image_url so frontend can load images
            if r.get('image'):
                img = r['image']
                if not img.startswith('images/') and not img.startswith('http'):
                    r['image_url'] = f"images/{img}"
                else:
                    r['image_url'] = img
        return jsonify(recipes)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recipes/feed', methods=['GET'])
def get_feed():
    uid   = session.get('user_id', 1)
    limit = int(request.args.get('limit', 10))
    try:
        recipes = query("""
            SELECT r.*,
                   u.name AS author_name, u.avatar AS author_avatar,
                   (SELECT COUNT(*) FROM likes    l WHERE l.recipe_id = r.id) AS like_count,
                   (SELECT COUNT(*) FROM comments c WHERE c.recipe_id = r.id) AS comment_count
            FROM recipes r
            JOIN users u ON r.user_id = u.id
            WHERE r.user_id IN (SELECT following_id FROM follows WHERE follower_id = %s)
               AND r.is_draft = 0
            ORDER BY r.created_at DESC LIMIT %s
        """, (uid, limit))
        return jsonify(recipes)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recipes/<int:rid>', methods=['GET'])
def get_recipe(rid):
    uid = session.get('user_id', 0)
    try:
        recipe = query("""
            SELECT r.*,
                   u.name AS author_name, u.avatar AS author_avatar, u.bio AS author_bio,
                   (SELECT COUNT(*) FROM likes    l WHERE l.recipe_id = r.id) AS like_count,
                   (SELECT COUNT(*) FROM comments c WHERE c.recipe_id = r.id) AS comment_count,
                   (SELECT COUNT(*) FROM likes    l WHERE l.recipe_id = r.id AND l.user_id = %s) AS user_liked,
                   (SELECT COUNT(*) FROM bookmarks b WHERE b.recipe_id = r.id AND b.user_id = %s) AS user_bookmarked
            FROM recipes r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = %s AND r.is_draft = 0
        """, (uid, uid, rid), one=True)
        if not recipe:
            return jsonify({"error": "Recipe not found"}), 404

        for f in ('ingredients', 'steps'):
            if recipe.get(f) and isinstance(recipe[f], str):
                try: recipe[f] = json.loads(recipe[f])
                except: pass
        # Attach image URL
        if recipe.get('image'):
            recipe['image_url'] = f"images/{recipe['image']}"
        recipe['cook_time'] = recipe.get('cook_time', '').upper() if recipe.get('cook_time') else ''
        return jsonify(recipe)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recipes', methods=['POST'])
def upload_recipe():
    # Support both JSON and Form data
    data = {}
    if request.is_json:
        data = request.json
    else:
        # Normalize form data to dict
        data = request.form.to_dict()

    uid         = data.get('user_id', session.get('user_id', 1))
    title       = data.get('title', '')
    description = data.get('description', '')
    ingredients = data.get('ingredients', '[]')
    steps       = data.get('steps', '[]')
    tags        = str(data.get('tags', ''))
    diet_type   = data.get('diet_type', '')
    cook_time   = data.get('cook_time', '')
    difficulty  = data.get('difficulty', 'Casual Cooking')
    servings    = data.get('servings', 4)
    is_draft    = int(data.get('is_draft', 0))

    # Convert complex objects to JSON strings for MySQL if needed
    if isinstance(ingredients, (list, dict)): ingredients = json.dumps(ingredients)
    if isinstance(steps, (list, dict)):       steps       = json.dumps(steps)
    if isinstance(tags, (list, dict)):        tags        = ",".join(tags)

    filename = None
    if 'image' in request.files:
        image = request.files['image']
        if image.filename:
            filename = image.filename
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    try:
        rid = query("""
            INSERT INTO recipes
              (user_id,title,description,ingredients,steps,image,tags,diet_type,cook_time,difficulty,servings,is_draft)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (uid, title, description, ingredients, steps, filename, tags, diet_type, cook_time, difficulty, servings, is_draft),
        commit=True)
        return jsonify({"message": "Recipe saved", "id": rid}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recipes/<int:rid>', methods=['DELETE'])
def delete_recipe(rid):
    try:
        query("DELETE FROM recipes WHERE id=%s", (rid,), commit=True)
        return jsonify({"message": "Recipe deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Likes ─────────────────────────────────────────────────────
@app.route('/api/recipes/<int:rid>/like', methods=['POST'])
def toggle_like(rid):
    uid = request.json.get('user_id', session.get('user_id', 1))
    try:
        existing = query("SELECT id FROM likes WHERE user_id=%s AND recipe_id=%s", (uid, rid), one=True)
        if existing:
            query("DELETE FROM likes WHERE user_id=%s AND recipe_id=%s", (uid, rid), commit=True)
            liked = False
        else:
            query("INSERT INTO likes (user_id,recipe_id) VALUES (%s,%s)", (uid, rid), commit=True)
            liked = True
        count = query("SELECT COUNT(*) AS c FROM likes WHERE recipe_id=%s", (rid,), one=True)['c']
        return jsonify({"liked": liked, "count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Bookmarks ─────────────────────────────────────────────────
@app.route('/api/recipes/<int:rid>/bookmark', methods=['POST'])
def toggle_bookmark(rid):
    uid = request.json.get('user_id', session.get('user_id', 1))
    try:
        existing = query("SELECT id FROM bookmarks WHERE user_id=%s AND recipe_id=%s", (uid, rid), one=True)
        if existing:
            query("DELETE FROM bookmarks WHERE user_id=%s AND recipe_id=%s", (uid, rid), commit=True)
            saved = False
        else:
            query("INSERT INTO bookmarks (user_id,recipe_id) VALUES (%s,%s)", (uid, rid), commit=True)
            saved = True
        return jsonify({"saved": saved})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Comments ──────────────────────────────────────────────────
@app.route('/api/recipes/<int:rid>/comments', methods=['GET'])
def get_comments(rid):
    try:
        comments = query("""
            SELECT c.id, c.comment, c.created_at,
                   u.name AS author, u.id AS user_id
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.recipe_id = %s
            ORDER BY c.created_at ASC
        """, (rid,))
        return jsonify(comments)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/recipes/<int:rid>/comments', methods=['POST'])
def add_comment(rid):
    d = request.json or {}
    uid = d.get('user_id', session.get('user_id', 1))
    try:
        cid = query(
            "INSERT INTO comments (user_id,recipe_id,comment) VALUES (%s,%s,%s)",
            (uid, rid, d.get('comment', '')), commit=True
        )
        comment = query("""
            SELECT c.id, c.comment, c.created_at, u.name AS author
            FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id=%s
        """, (cid,), one=True)
        return jsonify(comment), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/comments/<int:cid>', methods=['DELETE'])
def delete_comment(cid):
    try:
        query("DELETE FROM comments WHERE id=%s", (cid,), commit=True)
        return jsonify({"message": "Comment deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Users ─────────────────────────────────────────────────────
@app.route('/api/users/<int:uid>', methods=['GET'])
def get_user(uid):
    me_id = session.get('user_id', 0)
    try:
        user = query("""
            SELECT u.id, u.name, u.email, u.avatar, u.bio, u.role, u.created_at,
                   (SELECT COUNT(*) FROM recipes WHERE user_id=u.id AND is_draft=0) AS recipes,
                   (SELECT COUNT(*) FROM follows WHERE following_id=u.id)            AS followers,
                   (SELECT COUNT(*) FROM follows WHERE follower_id=u.id)             AS following,
                   (SELECT COUNT(*) FROM follows WHERE follower_id=%s AND following_id=u.id) AS i_follow
            FROM users u WHERE u.id=%s
        """, (me_id, uid), one=True)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = query("""
            SELECT u.id, u.name, u.email, u.avatar, u.bio, u.role, u.created_at,
                   (SELECT COUNT(*) FROM recipes WHERE user_id=u.id AND is_draft=0) AS recipes,
                   (SELECT COUNT(*) FROM follows WHERE following_id=u.id)            AS followers
            FROM users u ORDER BY u.role, u.created_at
        """)
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<int:uid>', methods=['DELETE'])
def delete_user(uid):
    try:
        query("DELETE FROM users WHERE id=%s", (uid,), commit=True)
        return jsonify({"message": "User deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<int:uid>/recipes', methods=['GET'])
def get_user_recipes(uid):
    tab = request.args.get('tab', 'recipes')
    try:
        if tab == 'bookmarks':
            return jsonify(query("""
                SELECT r.*, u.name AS author_name,
                       (SELECT COUNT(*) FROM likes    l WHERE l.recipe_id=r.id) AS like_count,
                       (SELECT COUNT(*) FROM comments c WHERE c.recipe_id=r.id) AS comment_count
                FROM bookmarks b
                JOIN recipes r ON b.recipe_id=r.id
                JOIN users   u ON r.user_id=u.id
                WHERE b.user_id=%s ORDER BY b.created_at DESC
            """, (uid,)))
        elif tab == 'liked':
            return jsonify(query("""
                SELECT r.*, u.name AS author_name,
                       (SELECT COUNT(*) FROM likes    l WHERE l.recipe_id=r.id) AS like_count,
                       (SELECT COUNT(*) FROM comments c WHERE c.recipe_id=r.id) AS comment_count
                FROM likes lk
                JOIN recipes r ON lk.recipe_id=r.id
                JOIN users   u ON r.user_id=u.id
                WHERE lk.user_id=%s ORDER BY lk.created_at DESC
            """, (uid,)))
        else:
            return jsonify(query("""
                SELECT r.*, u.name AS author_name,
                       (SELECT COUNT(*) FROM likes    l WHERE l.recipe_id=r.id) AS like_count,
                       (SELECT COUNT(*) FROM comments c WHERE c.recipe_id=r.id) AS comment_count
                FROM recipes r JOIN users u ON r.user_id=u.id
                WHERE r.user_id=%s AND r.is_draft=0 ORDER BY r.created_at DESC
            """, (uid,)))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Follows ───────────────────────────────────────────────────
@app.route('/api/follow', methods=['POST'])
def toggle_follow():
    d = request.json or {}
    follower_id  = d.get('follower_id', session.get('user_id', 1))
    following_id = d.get('following_id')
    if not following_id:
        return jsonify({"error": "following_id required"}), 400
    try:
        existing = query(
            "SELECT id FROM follows WHERE follower_id=%s AND following_id=%s",
            (follower_id, following_id), one=True
        )
        if existing:
            query("DELETE FROM follows WHERE follower_id=%s AND following_id=%s",
                  (follower_id, following_id), commit=True)
            following = False
        else:
            query("INSERT INTO follows (follower_id,following_id) VALUES (%s,%s)",
                  (follower_id, following_id), commit=True)
            following = True
        count = query("SELECT COUNT(*) AS c FROM follows WHERE following_id=%s",
                      (following_id,), one=True)['c']
        return jsonify({"following": following, "count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Static image uploads ──────────────────────────────────────
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ── Health check ──────────────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    try:
        count = query("SELECT COUNT(*) AS c FROM users", one=True)['c']
        return jsonify({"status": "ok", "app": "Flavora", "users": count})
    except Exception as e:
        return jsonify({"status": "db_error", "error": str(e)}), 500

# ── Run ───────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 50)
    print("  🍃  Flavora API — Starting …")
    print("  Database : flavora @ localhost")
    print("  API      : http://127.0.0.1:5000/api")
    print("=" * 50)
    app.run(debug=True, port=5000)
