Importing DTOs via Swagger:

1. Start the backend and check that Swagger is working (for instance http://localhost:5296/swagger)

2. If openapi-typescript is missing for some reason, install it in scripts folder:
    npm install openapi-typescript --save-dev
   
3. In scripts folder, run the following command:
    npx openapi-typescript http://localhost:5296/swagger/v1/swagger.json -o src/Data/Types/api.ts

