module Routes.Environments where

import Html exposing (div, button, text, Html)
import Html.Events exposing (onClick)
import Signal exposing (Address)

import Routing.Routes
import Actions exposing (Action)
import Models.Environment exposing (Environment)
import Model exposing (Model)
import Routes.Manifest

view : Address Action -> Model -> String -> Html
view address model env =
  div []
    [ div [] (List.map (\env -> div [] [text env.name]) model.environments)
    , nestedView address model env
    ]

nestedView : Address Action -> Model -> String -> Html
nestedView address model env =
  case model.activeRoute of
    Routing.Routes.Manifest envId ->
      Routes.Manifest.view address model.manifest env
    _ -> div [] []
