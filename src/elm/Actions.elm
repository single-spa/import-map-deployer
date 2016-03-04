module Actions where

import Models.Environment exposing (Environment)
import Models.Manifest exposing (Manifest)

type Action
  = RouteChanged String
  | GotEnvironments (Maybe (List Environment))
  | GotManifest (Maybe Manifest)
  | ServiceChange String String
  | SaveManifest (String, String) String
  | NoOp
