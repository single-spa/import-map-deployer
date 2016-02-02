module Ajax where

import Http exposing (Error)
import Task exposing (Task)
import Json.Decode as Json exposing ((:=), at)
import Effects exposing (Effects, Never)
import Html exposing (div, button, text, Html)
import Html.Events exposing (onClick)
import Signal exposing (Address)
import Debug

import Environments exposing (Environment, Environments)

type Action
  = GetEnvironments
  | GotEnvironments (Maybe Environments)

type alias Model = Environments

init : Model -> (Model, Effects Action)
init model =
  ( model
  , getEnvironments
  )

update : Action -> Model -> (Model, Effects Action)
update action model =
  case action of
    GetEnvironments ->
      ( model
      , getEnvironments)
    GotEnvironments environments ->
      ( Maybe.withDefault {environments = []} environments
      , Effects.none
      )

view : Address Action -> Model -> Html
view address model =
  div []
    [ div [] (List.map (\env -> div [] [text env.name]) model.environments)
    , button [onClick address GetEnvironments] [text "Get Enviros"]
    ]

getEnvironments : Effects Action
getEnvironments =
  Http.getString "http://localhost:5000/environments"
    |> Task.map parseEnvironments
    |> Task.toMaybe
    |> Task.map GotEnvironments
    |> Effects.task

environmentsDecoder : Json.Decoder (List Environment)
environmentsDecoder =
  at ["environments"]
    <| Json.list
    <| Json.object2 Environment
      ("name" := Json.string)
      ("isDefault" := Json.bool)

safeDecodeEnvironment : Result String (List Environment) -> Environments
safeDecodeEnvironment result =
  case result of
    Err msg ->
      {environments =  []}
    Ok environments ->
      {environments = environments}

parseEnvironments : String -> Environments
parseEnvironments jsonString =
  safeDecodeEnvironment
  (Json.decodeString environmentsDecoder jsonString)
