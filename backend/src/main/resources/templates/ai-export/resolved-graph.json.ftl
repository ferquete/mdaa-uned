<#-- Template FreeMarker para el grafo resuelto en JSON legible por LLMs -->
<#-- Usa Jackson para serialización final; este template genera la estructura lógica -->
<#-- NOTA: este template no se usa directamente, la serialización JSON la hace Jackson -->
<#-- en AiExportService. Este archivo existe como documentación de la estructura. -->
{
  "_metadata": {
    "projectName": "${graph.projectName}",
    "description": "${(graph.projectDescription?json_string)!""}",
    "generatedAt": "${generatedAt}",
    "note": "All UUIDs have been resolved to human-readable symbolic names. Use this file as primary reference when generating synthesis code."
  },
  "cimMachines": [
<#list graph.cimMachines as machine>
    {
      "id": "${machine.id}",
      "name": "${machine.name}",
      "description": "${(machine.description?json_string)!""}",
      "elements": [
<#list machine.elements as el>
        {
          "id": "${el.id}",
          "name": "${el.name}",
          "description": "${(el.description?json_string)!""}",
          "params": "${(el.params?json_string)!""}",
          "hasExternalInput": ${el.hasExternalInput?c},
          "hasExternalOutput": ${el.hasExternalOutput?c},
          "sendsTo": [<#list el.sendsToNames as s>"${s}"<#sep>, </#sep></#list>]
        }<#sep>,</#sep>
</#list>
      ]
    }<#sep>,</#sep>
</#list>
  ],
  "pimMachines": [
<#list graph.pimMachines as machine>
    {
      "id": "${machine.id}",
      "name": "${machine.name}",
      "description": "${(machine.description?json_string)!""}",
      "implementsCimMachines": [<#list machine.cimReferenceNames as c>"${c}"<#sep>, </#sep></#list>],
      "nodes": [
<#list machine.nodes as node>
        {
          "name": "${node.name}",
          "type": "${node.type}",
          "stereo": ${node.stereo?c},
          "description": "${(node.description?json_string)!""}",
          "params": {
<#list node.params?keys as key>
            "${key}": <#if node.params[key]??><#if node.params[key]?is_string>"${node.params[key]?json_string}"<#elseif node.params[key]?is_boolean>${node.params[key]?c}<#else>${node.params[key]}</#if><#else>null</#if><#sep>,</#sep>
</#list>
          },
          "externalOutputPorts": [<#list node.externalOutputPorts as p>"${p}"<#sep>, </#sep></#list>],
          "externalInputPorts": [<#list node.externalInputPorts as p>"${p}"<#sep>, </#sep></#list>]
        }<#sep>,</#sep>
</#list>
      ],
      "signalFlow": [
<#list machine.edges as edge>
        {
          "from": "${edge.sourceNodeName}.${edge.sourcePort}",
          "to": "${edge.targetNodeName}.${edge.targetPort}",
          "type": "${edge.type}"
        }<#sep>,</#sep>
</#list>
      ]
    }<#sep>,</#sep>
</#list>
  ],
  "interMachineConnections": [
<#list graph.pimRelations as rel>
    {
      "from": "${rel.sourceMachineName} → ${rel.sourcePortName}",
      "to": "${rel.destinationMachineName} → ${rel.destinationPortName}",
      "description": "${(rel.description?json_string)!""}"
    }<#sep>,</#sep>
</#list>
  ]
}
