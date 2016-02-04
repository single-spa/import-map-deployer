module Main where

import StartApp as StartApp
import Signal
import Task
import Effects exposing (Never)

import Environments

app =
  StartApp.start
    { init = Environments.init
    , update = Environments.update
    , view = Environments.view
    , inputs = []
    }

main =
  app.html

type alias Manifest =
  { sofe :
    { manifest : List Service }
  }

type alias Service =
  { name: String
  , url: String
  }

port tasks : Signal (Task.Task Never ())
port tasks =
  app.tasks
