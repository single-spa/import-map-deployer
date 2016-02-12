module Main where

import StartApp as StartApp
import Signal
import Task
import Effects exposing (Never)

import Model
import Update
import Environments

app =
  StartApp.start
    { init = Update.init
    , update = Update.update
    , view = Environments.view
    , inputs = []
    }

main =
  app.html

port tasks : Signal (Task.Task Never ())
port tasks =
  app.tasks
