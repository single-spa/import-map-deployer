module Main where

import StartApp as StartApp
import Signal
import Task
import Effects exposing (Never)
import Html exposing (Html)
import History

import Routing.Router
import Model exposing (Model)
import Update
import Actions exposing (Action)

view : Signal.Address Action -> Model -> Html
view address model =
  Routing.Router.route address model

routeChanges : Signal Action
routeChanges =
  Signal.map Actions.RouteChanged History.hash

app =
  StartApp.start
    { init = Update.init initialPath
    , update = Update.update
    , view = view
    , inputs = [routeChanges]
    }

main =
  app.html

port tasks : Signal (Task.Task Never ())
port tasks =
  app.tasks
port initialPath : String
