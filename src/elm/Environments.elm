module Environments where

import Manifest

import Http exposing (Error)
import Task exposing (Task)
import Json.Decode as Json exposing ((:=), at)
import Effects exposing (Effects, Never)
import Html exposing (div, button, text, Html)
import Html.Events exposing (onClick)
import Signal exposing (Address)
import Debug

type alias Environment =
  { name: String
  , isDefault: Bool
  }

type Action
  = GetEnvironments
  | GotEnvironments (Maybe (List Environment))
  | GotManifest (Maybe Manifest)

type alias Model =
  { environments: List Environment
  , selectedEnviro: Environment
  }


init : (Model, Effects Action)
init =
  ( { environments = []
    , selectedEnviro = {name  = "", isDefault = False}
    , manifest = Dict.empty
    }
  , getEnvironments
  )

update : Action -> Model -> (Model, Effects Action)
update action model =
  case action of
    GetEnvironments ->
      ( model
      , getEnvironments
      )
    GotEnvironments environments ->
      ( {model | environments = ( Maybe.withDefault [] environments )}
      , Effects.none
      )
    GetManifest ->
      ( model
      , Manifest.getManifest
      )
    GotManifest manifest ->
      ( {model | manifest = (Manifest.update manifest)}
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
  Http.getString "/environments"
    |> Task.map parseEnvironments
    |> Task.toMaybe
    |> Task.map GotEnvironments
    |> Effects.task

parseEnvironments : String -> List Environment
parseEnvironments jsonString =
  safeDecodeEnvironment
  (Json.decodeString environmentsDecoder jsonString)

safeDecodeEnvironment : Result String (List Environment) -> List Environment
safeDecodeEnvironment result =
  case result of
    Err msg ->
      []
    Ok environments ->
      environments

environmentsDecoder : Json.Decoder (List Environment)
environmentsDecoder =
  at ["environments"]
    <| Json.list
    <| Json.object2 Environment
      ("name" := Json.string)
      ("isDefault" := Json.bool)
