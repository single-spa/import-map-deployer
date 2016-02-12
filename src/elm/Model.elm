module Model where

import Models.Environment exposing (Environment)
import Models.Manifest exposing (Manifest)

type alias Model =
  { environments: List Environment
  , selectedEnviro: Environment
  , manifest: Manifest
  }

