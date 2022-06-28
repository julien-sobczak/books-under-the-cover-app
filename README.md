# Books Under the Cover App

A companion app to the blog post [Books Under the Cover](TODO).

The application is accessible [here](https://julien-sobczak.github.io/books-under-the-cover-app/).

## Dependencies

The project uses:

* [React](https://reactjs.org/)
* [Chart.js](https://www.chartjs.org/) in preference to [D3.js](https://d3js.org/) for rapid prototyping even if possibilities are more limited.
* [Parcel](https://parceljs.org/) because I lose too much time with Webpack on previous projects. I also lose too much time with Parcel 😀.

The project doesn't use:

* [Create React App](https://create-react-app.dev/) to have a minimal setup that is easy to customize, even when coming back to the project several months later.

## Setup

```shell
$ yarn add --dev parcel
$ yarn add react react-dom
```

## Run (locally)

```shell
$ yarn start
# Same as
$ yarn parcel src/index.html
# Browse to http://localhost:1234
```

## Build

```shell
$ yarn build
# Check dist/
```
