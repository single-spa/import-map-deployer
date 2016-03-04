module Routes.Manifest where

import Http exposing (Error)
import Html exposing (Html, div, text, button, input)
import Html.Attributes exposing (style, value)
import Html.Events exposing (onClick, targetValue, on)
import Dict exposing (Dict)
import Task exposing (Task)
import Signal exposing (Address)
import Effects exposing (Effects, Never)
import Json.Decode as Json exposing ((:=), at)
import Debug

import Actions exposing (Action)
import Models.Manifest exposing (Manifest)

view : Address Action -> Manifest -> Html
view address manifest =
  div
    []
    ((button
      [onClick address Actions.GetManifest]
      [text "Get Manifest"]
    ) ::
    ((Dict.toList manifest)
      |> List.map
        (\tup ->
          div
            [ style
              [("display", "flex"), ("flex-direction", "row")]
            ]
            [ div
              [ style
                [("font-weight", "bold")]
              ]
              [ text ((fst tup) ++ ": ")]
            , div
              []
              [ input
                [ value (snd tup)
                , on "input" targetValue ((Signal.message address) << Actions.ServiceChange (fst tup))
                ]
                []
              ]
            , button
              []
              [text "Save"]
            , button
              [style
                [ ("background", "red")
                , ("color", "white")
                ]
              ]
              [text "Delete"]
            ]
        )))

update: Maybe Manifest -> Manifest
update manifest =
    Maybe.withDefault Dict.empty manifest

getManifest : Effects Action
getManifest =
  Http.getString "/sofe-manifest.json?env=prod"
    |> Task.map parseManifest
    |> Task.toMaybe
    |> Task.map Actions.GotManifest
    |> Effects.task

parseManifest : String -> Manifest
parseManifest jsonString =
  safeDecodeManifest
  (Json.decodeString manifestDecoder jsonString)

safeDecodeManifest : Result String Manifest -> Manifest
safeDecodeManifest result =
  case result of
    Err msg ->
      Dict.empty
    Ok manifest ->
      manifest

manifestDecoder : Json.Decoder Manifest
manifestDecoder =
  at ["sofe"]
    <| at ["manifest"]
    <| Json.dict Json.string
