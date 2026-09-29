"""
InvoiceFlow Administrative Command Line Interface.
Allows interactive creation of initial superadmin and running migrations.
Never writes hard-coded credentials to SQL files.
"""

import sys
import asyncio
import getpass
import hashlib
from app.db.session import AsyncSessionLocal
from sqlalchemy import text


async def create_admin():
    print("=" * 60)
    print("INVOICEFLOW SECURE SUPERADMIN PROVISIONING")
    print("=" * 60)
    
    username = input("Enter admin username: ").strip()
    if not username:
        print("Error: Username cannot be empty.")
        sys.exit(1)
        
    email = input("Enter admin email address: ").strip()
    if not email:
        print("Error: Email cannot be empty.")
        sys.exit(1)
        
    password = getpass.getpass("Enter secure password (min 12 chars): ")
    if len(password) < 12:
        print("Error: Password must be at least 12 characters.")
        sys.exit(1)
        
    confirm_password = getpass.getpass("Confirm password: ")
    if password != confirm_password:
        print("Error: Passwords do not match.")
        sys.exit(1)
        
    full_name = input("Enter full name: ").strip() or "System Administrator"

    # PBKDF2 with SHA-256
    import os
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    hashed_pwd = f"pbkdf2:sha256:100000${salt.hex()}${key.hex()}"

    async with AsyncSessionLocal() as session:
        try:
            # 1. Ensure SUPERADMIN role exists
            role_sql = text("""
                INSERT INTO invoiceflow.role (role_key, role_name, description)
                VALUES ('SUPERADMIN', 'Enterprise Super Administrator', 'Full system access')
                ON CONFLICT (role_key) DO UPDATE SET is_active = TRUE
                RETURNING id;
            """)
            role_res = await session.execute(role_sql)
            role_id = role_res.scalar_one()

            # 2. Insert admin user
            user_sql = text("""
                INSERT INTO invoiceflow.app_user (username, email, password_hash, full_name, is_active)
                VALUES (:username, :email, :password_hash, :full_name, TRUE)
                ON CONFLICT (username) DO UPDATE 
                SET password_hash = :password_hash, full_name = :full_name, is_active = TRUE
                RETURNING id;
            """)
            user_res = await session.execute(user_sql, {
                "username": username,
                "email": email,
                "password_hash": hashed_pwd,
                "full_name": full_name
            })
            user_id = user_res.scalar_one()

            # 3. Associate role
            assoc_sql = text("""
                INSERT INTO invoiceflow.user_role (user_id, role_id)
                VALUES (:user_id, :role_id)
                ON CONFLICT DO NOTHING;
            """)
            await session.execute(assoc_sql, {"user_id": user_id, "role_id": role_id})

            await session.commit()
            print("\nSUCCESS: Superadmin user provisioned safely with cryptographic hash.")
        except Exception as e:
            await session.rollback()
            print(f"\nERROR: Failed to create superadmin: {e}")
            sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "create-admin":
        asyncio.run(create_admin())
    else:
        print("Usage: python -m app.cli create-admin")
