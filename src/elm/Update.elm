module Update where

import Effects exposing (Effects)
import Actions exposing (Action)
import Dict
import Maybe exposing (Maybe)

import Routing.Routes

import Model exposing (Model)
import Routes.Environments
import Routes.Manifest

init : String -> (Model, Effects Action)
init initialPath =
  ( { environments = []
    , selectedEnviro = {name  = "", isDefault = False}
    , manifest = Dict.empty
    , activeRoute = Routing.Routes.matchRoute initialPath
    }
  , Routes.Environments.getEnvironments
  )

update : Action -> Model -> (Model, Effects Action)
update action model =
  case action of
    Actions.RouteChanged routePath ->
      ( {model | activeRoute = Routing.Routes.matchRoute routePath}
      , Effects.none
      )
    Actions.GetEnvironments ->
      ( model
      , Routes.Environments.getEnvironments
      )
    Actions.GotEnvironments environments ->
      ( {model | environments = ( Maybe.withDefault [] environments )}
      , Effects.none
      )
    Actions.GetManifest ->
      ( model
      , Routes.Manifest.getManifest
      )
    Actions.GotManifest manifest ->
      ( {model | manifest = (Routes.Manifest.update manifest)}
      , Effects.none
      )
    Actions.ServiceChange key value ->
      ( {model | manifest = Dict.update key (\v-> Just value) model.manifest}
      , Effects.none
      )
