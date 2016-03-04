module Routing.Router where

import Signal exposing (Address)
import Html exposing (Html)

import Model exposing (Model)
import Routing.Routes exposing (Route)
import Actions exposing (Action)

import Routes.Environments
import Routes.NotFound

route : Address Action -> Model -> Html
route address model =
  case model.activeRoute of
    Routing.Routes.EnvironmentsIndex ->
      Routes.Environments.view address model
    Routing.Routes.Manifest envId ->
      Routes.Environments.view address model
    Routing.Routes.NotFound ->
      Routes.NotFound.view address model
