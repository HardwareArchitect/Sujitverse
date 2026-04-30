"""Usage: python -m app.cli_create_admin <username> <password>"""
import sys
from sqlmodel import Session, select

from app.db import engine, init_db
from app.models import User
from app.security import hash_password


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    username, password = sys.argv[1], sys.argv[2]
    if len(password) < 8:
        print("Password must be at least 8 characters")
        sys.exit(2)
    init_db()
    with Session(engine) as s:
        if s.exec(select(User).where(User.username == username)).first():
            print(f"User '{username}' already exists")
            sys.exit(3)
        u = User(username=username, hashed_password=hash_password(password), is_admin=True)
        s.add(u)
        s.commit()
        s.refresh(u)
        print(f"Created admin user '{u.username}' (id={u.id})")


if __name__ == "__main__":
    main()
