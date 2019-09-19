#-------------------------------------------------------------------------------
# Name:        módulo1
# Purpose:
#
# Author:      UO245303
#
# Created:     17/09/2019
# Copyright:   (c) UO245303 2019
# Licence:     <your licence>
#-------------------------------------------------------------------------------

from osgeo import ogr, osr
import shapely.wkt

"""
	Vías en mal estado municipio de Mieres.
"""

#Fichero de origen
fichero_origen = "shp/rt_tramo_vial.shp"
#Lo abrimos con el data source de origen
data_source_origen = ogr.Open(fichero_origen)
#Recuperamos la capa del origen
capa_origen = data_source_origen.GetLayer()

#Fichero de origen municipios españa
fichero_municipios = "shp/recintos_municipales_inspire_peninbal_etrs89.shp"
#Lo abrimos con el data source de origen
data_source_municipios = ogr.Open(fichero_municipios)
#Recuperamos la capa del origen
capa_municipios = data_source_municipios.GetLayer()

#Preparamos el fichero nuevo
fichero_destino = "shp/vias_mieres-v2.shp"
#Creamos el data source de destino
data_source_destino = ogr.GetDriverByName("ESRI Shapefile").CreateDataSource(fichero_destino)
#Creamos la capa de destino, con la referencia espacial del fichero de origen
capa_destino = data_source_destino.CreateLayer("Vías Mieres",capa_origen.GetSpatialRef())

#vía
esquema_atributo = ogr.FieldDefn("DENOM", ogr.OFTString) #nombre
esquema_atributo.SetWidth(60)
capa_destino.CreateField(esquema_atributo)

# clase
esquema_atributo = ogr.FieldDefn("CLASE", ogr.OFTString) #claseD
esquema_atributo.SetWidth(60)
capa_destino.CreateField(esquema_atributo)

# tipo vía
esquema_atributo = ogr.FieldDefn("TIPO", ogr.OFTString) #tipo_vialD
esquema_atributo.SetWidth(60)
capa_destino.CreateField(esquema_atributo)

#firmeD
esquema_atributo = ogr.FieldDefn("FIRME", ogr.OFTString) #firmeD
esquema_atributo.SetWidth(60)
capa_destino.CreateField(esquema_atributo)

#ncarriles
esquema_atributo = ogr.FieldDefn("CARRILES", ogr.OFTReal) #ncarriles
esquema_atributo.SetWidth(60)
esquema_atributo.SetPrecision(11)
capa_destino.CreateField(esquema_atributo)

#sentido
esquema_atributo = ogr.FieldDefn("SENTIDO", ogr.OFTString) #sentidoD
esquema_atributo.SetWidth(60)
capa_destino.CreateField(esquema_atributo)

#estadofisD
esquema_atributo = ogr.FieldDefn("ESTADO", ogr.OFTString)
esquema_atributo.SetWidth(60)
capa_destino.CreateField(esquema_atributo)

#titularD
esquema_atributo = ogr.FieldDefn("TITULAR", ogr.OFTString)
esquema_atributo.SetWidth(60)
capa_destino.CreateField(esquema_atributo)

#Mieres (Codigo=34033333037).
geometria_mieres = None
feature_municipio = capa_municipios.GetNextFeature()
while feature_municipio:
    if "34033333037" in feature_municipio.GetField("NATCODE"):
        geometria_mieres = feature_municipio.GetGeometryRef().Clone()
    feature_municipio = capa_municipios.GetNextFeature()
data_source_municipios = None

#EPSG:3035
referencia_espacial_2D = osr.SpatialReference()
referencia_espacial_2D.ImportFromEPSG(3035)

transformacion = osr.CoordinateTransformation(geometria_mieres.GetSpatialReference(), referencia_espacial_2D)
geometria_mieres.Transform(transformacion)

#vías que están en Mieres
capa_destino_esquema = capa_destino.GetLayerDefn()
feature_via = capa_origen.GetNextFeature()

while feature_via:
    geometria_mieres_shapely = shapely.wkt.loads(geometria_mieres.ExportToWkt())
    geometria_via = feature_via.GetGeometryRef().Clone()
    transformacion = osr.CoordinateTransformation(geometria_via.GetSpatialReference(), referencia_espacial_2D)
    geometria_via.Transform(transformacion)
    geometria_via_shapely = shapely.wkt.loads(geometria_via.ExportToWkt())

    if geometria_mieres_shapely.contains(geometria_via_shapely) and feature_via.GetField("estadofis") == 1 and feature_via.GetField("firme") != 1:
    #if geometria_mieres_shapely.contains(geometria_via_shapely):

        feature_destino = ogr.Feature(capa_destino_esquema)

        #La geometría en Shapely a WKT
        geometria_via_wkt = shapely.wkt.dumps(geometria_via_shapely)
        #El WKT lo pasamos a Geometría OGR
        geometria_destino = ogr.CreateGeometryFromWkt(geometria_via_wkt)
        #Ahora tenemos la geometría pero en 2D, hay que deshacer la transformación
        transformacion = osr.CoordinateTransformation(referencia_espacial_2D,feature_via.GetGeometryRef().GetSpatialReference())
        geometria_destino.Transform(transformacion)
        feature_destino.SetGeometry(geometria_destino)
        #Rellenamos los atributos
        feature_destino.SetField("DENOM",feature_via.GetField("nombre"))
        feature_destino.SetField("CLASE",feature_via.GetField("claseD"))
        feature_destino.SetField("TIPO",feature_via.GetField("tipo_vialD"))
        feature_destino.SetField("FIRME",feature_via.GetField("firmeD"))
        feature_destino.SetField("CARRILES",feature_via.GetField("ncarriles"))
        feature_destino.SetField("SENTIDO",feature_via.GetField("sentidoD"))
        feature_destino.SetField("ESTADO",feature_via.GetField("estadofisD"))
        feature_destino.SetField("TITULAR",feature_via.GetField("titularD"))

        capa_destino.CreateFeature(feature_destino)
        feature_destino = None

    #Actualizamos la feature de origen
    feature_via = capa_origen.GetNextFeature()

data_source_destino = None
data_source_municipios = None
data_source_origen = None