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

#Preparamos el fichero /de destino/nuevo/a crear/
fichero_destino = "shp/vias_mieres-v2.shp"
#Creamos el data source de destino
data_source_destino = ogr.GetDriverByName("ESRI Shapefile").CreateDataSource(fichero_destino)
#Creamos la capa de destino, con la referencia espacial del fichero de origen
capa_destino = data_source_destino.CreateLayer("Vías Mieres",capa_origen.GetSpatialRef())

#A continuación, damos forma al molde.

#Un atributo con el nombre de la vía
esquema_atributo = ogr.FieldDefn("NOMBRE", ogr.OFTString) #nombre
esquema_atributo.SetWidth(60)
capa_destino.CreateField(esquema_atributo)

# clase
esquema_atributo = ogr.FieldDefn("CLASE_VIA", ogr.OFTString) #claseD
esquema_atributo.SetWidth(30)
capa_destino.CreateField(esquema_atributo)

# tipo vía
esquema_atributo = ogr.FieldDefn("TIPO_VIA", ogr.OFTString) #tipo_vialD
esquema_atributo.SetWidth(30)
capa_destino.CreateField(esquema_atributo)

#firmeD
esquema_atributo = ogr.FieldDefn("FIRME_VIA", ogr.OFTString) #firmeD
esquema_atributo.SetWidth(30)
capa_destino.CreateField(esquema_atributo)

#ncarriles
esquema_atributo = ogr.FieldDefn("CARRILES_VIA", ogr.OFTReal) #ncarriles
esquema_atributo.SetWidth(20)
esquema_atributo.SetPrecision(11)
capa_destino.CreateField(esquema_atributo)

#sentido
esquema_atributo = ogr.FieldDefn("SENTIDO_VIA", ogr.OFTString) #sentidoD
esquema_atributo.SetWidth(30)
capa_destino.CreateField(esquema_atributo)

#estadofisD
esquema_atributo = ogr.FieldDefn("ESTADO_VIA", ogr.OFTString)
esquema_atributo.SetWidth(30)
capa_destino.CreateField(esquema_atributo)

#titularD
esquema_atributo = ogr.FieldDefn("TITULAR_VIA", ogr.OFTString)
esquema_atributo.SetWidth(30)
capa_destino.CreateField(esquema_atributo)

#Vamos a buscar la geometría de Mieres (Codigo=34033333037).
geometria_mieres = None

feature_municipio = capa_municipios.GetNextFeature()
while feature_municipio:
    #¿Es Mieres?
    if "34033333037" in feature_municipio.GetField("NATCODE"):
        #Guardamos la geometría
        geometria_mieres = feature_municipio.GetGeometryRef().Clone()
    #Actualizamos la feature de origen
    feature_municipio = capa_municipios.GetNextFeature()
#Liberamos el data source de provincias
data_source_municipios = None

#EPSG:3035 Proyección 2D útil para Europa.
referencia_espacial_2D = osr.SpatialReference()
referencia_espacial_2D.ImportFromEPSG(3035)

transformacion = osr.CoordinateTransformation(geometria_mieres.GetSpatialReference(), referencia_espacial_2D)
geometria_mieres.Transform(transformacion)

"""
    A partir de aquí, iteramos por las features de origen, y volcamos aquellas
    que cumplen la condición
"""
#Ahora recorremos el SHP de las vías y volcamos las vías que están en Mieres
capa_destino_esquema = capa_destino.GetLayerDefn()
feature_via = capa_origen.GetNextFeature()

while feature_via:
    """
        En este momento, tenemos las geometrías de Asturias y el río actual
        proyectadas en un plano 2D.
        Shapely y OGR pueden interoperar si convertimos las geometrías a WKT
    """
    geometria_mieres_shapely = shapely.wkt.loads(geometria_mieres.ExportToWkt())
    geometria_via = feature_via.GetGeometryRef().Clone()
    transformacion = osr.CoordinateTransformation(geometria_via.GetSpatialReference(), referencia_espacial_2D)
    geometria_via.Transform(transformacion)
    geometria_via_shapely = shapely.wkt.loads(geometria_via.ExportToWkt())

    #¿Contiene Asturias al río?
    if geometria_mieres_shapely.contains(geometria_via_shapely) and feature_via.GetField("estadofis") == 1 and feature_via.GetField("firme") != 1:
    #if geometria_mieres_shapely.contains(geometria_via_shapely):
        #Entonces volcamos
        #Volcamos al nuevo
        #Creamos la feature de destino
        feature_destino = ogr.Feature(capa_destino_esquema)
        """ Podríamos añadir la geometría original del río directamente
            pero para continuar con el ejemplo, vamos a realizar el proceso
            inverso al anterior
        """
        #La geometría en Shapely a WKT
        geometria_via_wkt = shapely.wkt.dumps(geometria_via_shapely)
        #El WKT lo pasamos a Geometría OGR
        geometria_destino = ogr.CreateGeometryFromWkt(geometria_via_wkt)
        #Ahora tenemos la geometría pero en 2D, hay que deshacer la transformación
        transformacion = osr.CoordinateTransformation(referencia_espacial_2D,feature_via.GetGeometryRef().GetSpatialReference())
        geometria_destino.Transform(transformacion)
        #Ahora ya asignamos la geometría a la nueva feature
        feature_destino.SetGeometry(geometria_destino)
        #Rellenamos los atributos
        feature_destino.SetField("NOMBRE",feature_via.GetField("nombre"))
        feature_destino.SetField("CLASE_VIA",feature_via.GetField("claseD"))
        feature_destino.SetField("TIPO_VIA",feature_via.GetField("tipo_vialD"))
        feature_destino.SetField("FIRME_VIA",feature_via.GetField("firmeD"))
        feature_destino.SetField("CARRILES_VIA",feature_via.GetField("ncarriles"))
        feature_destino.SetField("SENTIDO_VIA",feature_via.GetField("sentidoD"))
        feature_destino.SetField("ESTADO_VIA",feature_via.GetField("estadofisD"))
        feature_destino.SetField("TITULAR_VIA",feature_via.GetField("titularD"))

        #Volcamos a la capa
        capa_destino.CreateFeature(feature_destino)
        #Limpiamos referencia
        feature_destino = None

    #Actualizamos la feature de origen
    feature_via = capa_origen.GetNextFeature()

#Una vez acabado el bucle, liberamos los data sources
data_source_destino = None
data_source_municipios = None
data_source_origen = None