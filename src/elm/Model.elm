module Model where

import Models.Environment exposing (Environment)
import Models.Manifest exposing (Manifest)
import Routing.Routes exposing (Route)

type alias Model =
  { environments: List Environment
  , selectedEnviro: Environment
  , manifest: Manifest
  , activeRoute: Route
  }
