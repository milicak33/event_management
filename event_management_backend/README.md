# Event Management Master Starter

Početna osnova za master rad: sistem za upravljanje događajima sa WebSocket podrškom i kontrolom konkurentnog pristupa.

## Paket

Kod je organizovan pod paketom:

```text
com.eventmanagement
```

## Tehnologije

- Java 21
- Spring Boot 3.5
- Maven
- PostgreSQL
- Spring Data JPA
- WebSocket/STOMP
- Lombok

## Baza

Pre pokretanja proveri da imaš bazu i korisnika:

```sql
CREATE DATABASE event_management;
CREATE USER event_user WITH PASSWORD 'event_password';
GRANT ALL PRIVILEGES ON DATABASE event_management TO event_user;
\c event_management
GRANT ALL ON SCHEMA public TO event_user;
```

## Pokretanje backend-a

```bash
cd backend
mvn spring-boot:run
```

Aplikacija se pokreće na:

```text
http://localhost:8080
```

## Korisni endpointi

### Kreiranje korisnika

```http
POST /api/users
```

Primer tela:

```json
{
  "username": "jelena",
  "email": "jelena@example.com",
  "password": "123456",
  "role": "PARTICIPANT"
}
```

### Kreiranje događaja

```http
POST /api/events
```

Primer tela:

```json
{
  "title": "Java konferencija",
  "description": "Događaj za testiranje prijava",
  "location": "Beograd",
  "startTime": "2026-07-01T10:00:00",
  "endTime": "2026-07-01T12:00:00",
  "capacity": 2
}
```

### Prijava na događaj - optimističko zaključavanje

```http
POST /api/events/1/registrations/optimistic?userId=1
```

### Prijava na događaj - pesimističko zaključavanje

```http
POST /api/events/1/registrations/pessimistic?userId=1
```

## Važno za master rad

U entitetu `Event` postoji:

```java
@Version
private Long version;
```

To je osnova za optimističko zaključavanje.

U `EventRepository` postoji:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Event> findByIdForUpdate(Long id);
```

To je osnova za pesimističko zaključavanje.

Kasnije možeš da porediš ova dva pristupa pod opterećenjem.
