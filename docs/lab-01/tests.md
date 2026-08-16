# Lab 1 — Test Plan and Evidence

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | **PASSED** |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | **PASSED** |
| 3 | Vitest | Heading renders | **PASSED** |
| 4 | Vitest | Success state shows Online + category list | **PASSED** |
| 5 | Vitest | Error state shows Offline + message | **PASSED** |

### Passing Terminal Output

#### Server API Tests (Supertest / Vitest)

```
npm notice run toktickit-server@1.0.0 test
npm notice run vitest run

 RUN  v2.1.9 C:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/toktickit/server

 ✓ tests/lab-01/health.test.ts (1 test) 29ms
 ✓ tests/lab-01/categories.test.ts (1 test) 158ms

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  16:20:14
   Duration  1.33s (transform 114ms, setup 0ms, collect 850ms, tests 188ms, environment 0ms, prepare 418ms)
```

#### Client UI Tests (Vitest / Testing Library)

```
npm notice run toktickit-client@1.0.0 test
npm notice run vitest run

 RUN  v2.1.9 C:/Users/aricl/OneDrive/Bureau/KMUTT_classes/swe/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3 tests) 243ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  16:20:23
   Duration  2.67s (transform 99ms, setup 217ms, collect 391ms, tests 243ms, environment 1.19s, prepare 235ms)
```

