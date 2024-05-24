# APPRAISAL

This is the appraisal project. It was a project done for fun during self-directed project time
by a manager at Caplin with the aim of creating a simple appraisal system for Caplin to use internally.

It is released under the MIT license.

## Developing locally

The recommended way to develop this is to install

 * [devbox](https://www.jetify.com/devbox)
 * [direnv](https://direnv.net/docs/installation.html)

All other dependencies are managed with these tools.  I develop on linux, but I haven't deliberately
done anything to make other systems not work. I do expect that you'll want to be on WSL on windows.

Then when you go into the project directory, direnv will start the devbox environment.
If it doesn't, you can drop into the shell with `devbox shell`. 

You may need to run `direnv allow` to give the setup scripts permission to run.

If you have any port clashes, you can change them in `setup/dev.env`

On first checkout, your first step is to create and run the postgresql database.

```bash
devbox run init_db
devbox services up
```

This will take over the terminal, so then you'll need another one for 

```bash
devbox run reset_db
```

Which will create the tables and load some basic dummy data into the database.

Next, go into the `application` folder.

```bash
cd application
npm install
npm run start-dev
```

That will run the api server.  The application is also served from the api server, but
if you want to work on the front end, you will need another terminal

```bash
cd frontend
yarn install
yarn start
```

Yes, I'm using `npm` for the backend and `yarn` for the front end! "A foolish consistency is the hobgoblin of 
little minds".  I inherited yarn from the create react app template that I used to get started on the front end.

The front end server will proxy calls through to the backend server to avoid any cors issues,
but when we deploy we copy the front end into the backend and deploy just the backend server.

When you are happy with your front end changes, send them across to the application/public folder by running 

```bash
./deploy.sh
```

The intellij project files are checked in, so if you're using intellij, you should have a database data source
set up too.