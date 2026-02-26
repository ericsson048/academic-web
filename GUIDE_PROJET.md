# APAS - Guide Projet et Utilisation

Ce document explique le projet APAS et comment le lancer/utiliser rapidement.

## 1. Presentation

APAS (Academic Performance Analytics System) est une application web full-stack pour:
- gerer les etudiants, classes, semestres, matieres et notes
- suivre la performance academique
- afficher un dashboard analytique
- produire des rapports PDF

Stack technique:
- Backend: Django + Django REST Framework + JWT
- Frontend: React + TypeScript + Vite + Tailwind
- Base de donnees: PostgreSQL (prod/dev), SQLite en tests backend

## 2. Fonctionnalites principales

- Authentification JWT (login/refresh/logout)
- Gestion des etudiants
- Gestion des classes
- Gestion des semestres
- Gestion des notes + historique de modifications
- Dashboard analytique (summary, matieres, evolution)
- Documentation API Swagger / Redoc
- Interface multilingue (fr par defaut)

## 3. Prerequis

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## 4. Installation

### 4.1 Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Configurer `backend/.env` (DB, secret key, etc.), puis:

```powershell
python manage.py migrate
python manage.py runserver
```

Backend dispo sur: `http://localhost:8000`

### 4.2 Frontend

Depuis la racine du projet:

```powershell
npm install
copy .env.example .env
npm run dev
```

Frontend dispo sur: `http://localhost:5173`

## 5. Comptes et profils (admin / teacher)

### Option A: Donnees de demo (recommande)

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py seed_data
```

Compte cree automatiquement:
- `admin_seed` / `admin123` (role `admin`)

### Option B: Creation manuelle

Creer un compte admin:

```powershell
python manage.py shell -c "from authentication.models import User; User.objects.create_user(username='admin1', password='admin123', role='admin', email='admin1@local.test')"
```

Creer un compte teacher:

```powershell
python manage.py shell -c "from authentication.models import User; User.objects.create_user(username='teacher1', password='teacher123', role='teacher', email='teacher1@local.test')"
```

Important:
- Les permissions API se basent sur le champ `role` (`admin` ou `teacher`)
- Un utilisateur doit avoir `role='admin'` pour les operations d'ecriture reservees admin

## 6. URLs utiles

Frontend:
- Login: `http://localhost:5173/login`
- Dashboard: `http://localhost:5173/`
- Etudiants: `http://localhost:5173/students`
- Classes: `http://localhost:5173/classes`
- Semestres: `http://localhost:5173/semesters`
- Notes: `http://localhost:5173/grades`
- Rapports: `http://localhost:5173/reports`

Backend/API:
- Admin Django: `http://localhost:8000/admin/`
- Swagger: `http://localhost:8000/api/docs/`
- Redoc: `http://localhost:8000/api/redoc/`
- OpenAPI schema: `http://localhost:8000/api/schema/`

## 7. Endpoints API principaux

Auth:
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

Students:
- `GET/POST /api/students/`
- `GET/PUT/PATCH/DELETE /api/students/{id}/`

Classes:
- `GET/POST /api/students/classes/`
- `GET/PUT/PATCH/DELETE /api/students/classes/{id}/`

Semesters:
- `GET/POST /api/students/semesters/`
- `GET/PUT/PATCH/DELETE /api/students/semesters/{id}/`

Subjects:
- `GET/POST /api/students/subjects/`
- `GET/PUT/PATCH/DELETE /api/students/subjects/{id}/`

Grades:
- `GET/POST /api/grades/`
- `GET/PUT/PATCH/DELETE /api/grades/{id}/`
- `GET /api/grades/{id}/history/`
- `POST /api/grades/bulk-create/`

Analytics:
- `GET /api/analytics/summary/`
- `GET /api/analytics/performance-by-subject/`
- `GET /api/analytics/performance-evolution/`
- `GET /api/analytics/student/{student_id}/`

## 8. Utilisation type

1. Se connecter sur `/login`
2. Aller sur:
   - `Classes` et `Semestres` (souvent admin)
   - `Etudiants` pour affecter les classes
   - `Notes` pour saisir/modifier les notes
   - `Dashboard` pour visualiser la performance
3. Generer des rapports dans `Rapports`

## 9. Roles et droits (resume)

- `teacher`:
  - lecture des entites support (classes, semestres, matieres)
  - acces notes/analytics (selon endpoints autorises)
- `admin`:
  - tous les droits CRUD sur les ressources admin-only

## 10. Commandes utiles

Lancer tests frontend:

```powershell
npm run test
```

Build frontend:

```powershell
npm run build
```

Lancer tests backend:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py test
```

Vider les donnees de demo:

```powershell
python manage.py clear_sample_data
```

---

Si besoin, commencer par le workflow le plus simple:
1. `python manage.py seed_data`
2. login `admin_seed/admin123`
3. ouvrir le dashboard et la page notes.
