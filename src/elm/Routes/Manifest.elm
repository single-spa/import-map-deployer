module Routes.Manifest where

import Html exposing (Html, div, text, button, input)
import Html.Attributes exposing (style, value, class)
import Html.Events exposing (onClick, targetValue, on)
import Dict exposing (Dict)
import Signal exposing (Address)
import Debug

import Actions exposing (Action)
import Models.Manifest exposing (Manifest)

view : Address Action -> Manifest -> String -> Html
view address manifest envId =
  div
    [ class "cps-form-horizontal"]
    ((Dict.toList manifest)
      |> List.map
        (\tup ->
          div
            [ style
              [("display", "flex"), ("flex-direction", "row")]
            , class "cps-form-group"
            ]
            [ div
              [ style [("font-weight", "bold")]
              , class "cps-col-xs-2 cps-control-label"
              ]
              [ text ((fst tup) ++ ": ")]
            , input
              [ value (snd tup)
              , on "input" targetValue ((Signal.message address) << Actions.ServiceChange (fst tup))
              , class "cps-form-control"
              , style [("width", "500px")]
              ]
              []
            , button
              [ class "cps-btn +primary cps-margin-left-24"
              , onClick address (Actions.SaveManifest tup envId)]
              [text "Save"]
            , button
              [ class "cps-btn +secondary"
              ]
              [text "Delete"]
            ]
        ))
