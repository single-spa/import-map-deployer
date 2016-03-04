module Routes.NotFound where

import Signal exposing (Address)
import Html exposing (Html, div, text)

import Actions exposing (Action)
import Model exposing (Model)

view : Address Action -> Model -> Html
view model address =
  div
    []
    [text "404"]
