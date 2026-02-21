// Estructura UBL 2.1 base. La firma digital debe ser aplicada por un OSE autorizado.

import { ComprobanteElectronico, ItemComprobante } from './types'

const UBL_NAMESPACES = {
  invoice: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
  creditNote: 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
  debitNote: 'urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2',
  cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  ext: 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
  ds: 'http://www.w3.org/2000/09/xmldsig#',
  sac: 'urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1',
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

function buildItemXML(item: ItemComprobante, index: number): string {
  const taxCategoryId = item.tipo_afectacion_igv === '10' ? 'S'
    : item.tipo_afectacion_igv === '20' ? 'E'
    : 'O'

  const taxSchemeId = item.tipo_afectacion_igv === '10' ? '1000'
    : item.tipo_afectacion_igv === '20' ? '9997'
    : '9998'

  const taxSchemeName = item.tipo_afectacion_igv === '10' ? 'IGV'
    : item.tipo_afectacion_igv === '20' ? 'EXO'
    : 'INA'

  return `
        <cac:InvoiceLine>
            <cbc:ID>${index + 1}</cbc:ID>
            <cbc:InvoicedQuantity unitCode="${escapeXml(item.unidad_medida)}">${formatAmount(item.cantidad)}</cbc:InvoicedQuantity>
            <cbc:LineExtensionAmount currencyID="{{CURRENCY}}">${formatAmount(item.cantidad * item.valor_unitario)}</cbc:LineExtensionAmount>
            <cac:PricingReference>
                <cac:AlternativeConditionPrice>
                    <cbc:PriceAmount currencyID="{{CURRENCY}}">${formatAmount(item.precio_unitario)}</cbc:PriceAmount>
                    <cbc:PriceTypeCode>${item.tipo_afectacion_igv === '10' ? '01' : '02'}</cbc:PriceTypeCode>
                </cac:AlternativeConditionPrice>
            </cac:PricingReference>
            <cac:TaxTotal>
                <cbc:TaxAmount currencyID="{{CURRENCY}}">${formatAmount(item.igv)}</cbc:TaxAmount>
                <cac:TaxSubtotal>
                    <cbc:TaxableAmount currencyID="{{CURRENCY}}">${formatAmount(item.cantidad * item.valor_unitario)}</cbc:TaxableAmount>
                    <cbc:TaxAmount currencyID="{{CURRENCY}}">${formatAmount(item.igv)}</cbc:TaxAmount>
                    <cac:TaxCategory>
                        <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">${taxCategoryId}</cbc:ID>
                        <cbc:Percent>${item.tipo_afectacion_igv === '10' ? '18.00' : '0.00'}</cbc:Percent>
                        <cbc:TaxExemptionReasonCode>${item.tipo_afectacion_igv}</cbc:TaxExemptionReasonCode>
                        <cac:TaxScheme>
                            <cbc:ID>${taxSchemeId}</cbc:ID>
                            <cbc:Name>${taxSchemeName}</cbc:Name>
                            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                        </cac:TaxScheme>
                    </cac:TaxCategory>
                </cac:TaxSubtotal>
            </cac:TaxTotal>
            <cac:Item>
                <cbc:Description><![CDATA[${item.descripcion}]]></cbc:Description>
            </cac:Item>
            <cac:Price>
                <cbc:PriceAmount currencyID="{{CURRENCY}}">${formatAmount(item.valor_unitario)}</cbc:PriceAmount>
            </cac:Price>
        </cac:InvoiceLine>`
}

function buildTipoDocumentoReceptor(tipo: string): string {
  const catalogoMap: Record<string, string> = {
    '0': '0',
    '1': '1',
    '6': '6',
  }
  return catalogoMap[tipo] ?? '0'
}

export function generateInvoiceXML(comprobante: ComprobanteElectronico): string {
  const isFactura = comprobante.tipo_comprobante === '01'
  const isBoleta = comprobante.tipo_comprobante === '03'
  const isNotaCredito = comprobante.tipo_comprobante === '07'
  const isNotaDebito = comprobante.tipo_comprobante === '08'

  const rootTag = isNotaCredito ? 'CreditNote'
    : isNotaDebito ? 'DebitNote'
    : 'Invoice'

  const rootNs = isNotaCredito ? UBL_NAMESPACES.creditNote
    : isNotaDebito ? UBL_NAMESPACES.debitNote
    : UBL_NAMESPACES.invoice

  const quantityTag = isNotaCredito ? 'CreditedQuantity'
    : isNotaDebito ? 'DebitedQuantity'
    : 'InvoicedQuantity'

  const lineTag = isNotaCredito ? 'CreditNoteLine'
    : isNotaDebito ? 'DebitNoteLine'
    : 'InvoiceLine'

  const gravadoTotal = comprobante.items
    .filter(i => i.tipo_afectacion_igv === '10')
    .reduce((sum, i) => sum + (i.cantidad * i.valor_unitario), 0)

  const exoneradoTotal = comprobante.items
    .filter(i => i.tipo_afectacion_igv === '20')
    .reduce((sum, i) => sum + (i.cantidad * i.valor_unitario), 0)

  const inafectoTotal = comprobante.items
    .filter(i => i.tipo_afectacion_igv === '30')
    .reduce((sum, i) => sum + (i.cantidad * i.valor_unitario), 0)

  const currency = comprobante.moneda

  const itemsXml = comprobante.items
    .map((item, index) => buildItemXML(item, index))
    .join('')
    .replace(/\{\{CURRENCY\}\}/g, currency)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<${rootTag}
    xmlns="${rootNs}"
    xmlns:cac="${UBL_NAMESPACES.cac}"
    xmlns:cbc="${UBL_NAMESPACES.cbc}"
    xmlns:ext="${UBL_NAMESPACES.ext}"
    xmlns:ds="${UBL_NAMESPACES.ds}"
    xmlns:sac="${UBL_NAMESPACES.sac}">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionContent>
                <!-- Aqui se inserta la firma digital por el OSE autorizado -->
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>2.0</cbc:CustomizationID>
    <cbc:ID>${escapeXml(comprobante.serie)}-${comprobante.numero}</cbc:ID>
    <cbc:IssueDate>${comprobante.fecha_emision}</cbc:IssueDate>
    <cbc:IssueTime>00:00:00</cbc:IssueTime>
    <cbc:${rootTag === 'Invoice' ? 'InvoiceTypeCode' : rootTag === 'CreditNote' ? 'ID' : 'ID'} listID="0101">${comprobante.tipo_comprobante}</cbc:${rootTag === 'Invoice' ? 'InvoiceTypeCode' : rootTag === 'CreditNote' ? 'ID' : 'ID'}>
    <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
    <cac:Signature>
        <cbc:ID>${escapeXml(comprobante.emisor.ruc)}</cbc:ID>
        <cac:SignatoryParty>
            <cac:PartyIdentification>
                <cbc:ID>${escapeXml(comprobante.emisor.ruc)}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[${comprobante.emisor.razon_social}]]></cbc:Name>
            </cac:PartyName>
        </cac:SignatoryParty>
        <cac:DigitalSignatureAttachment>
            <cac:ExternalReference>
                <cbc:URI>#SignKRONOS</cbc:URI>
            </cac:ExternalReference>
        </cac:DigitalSignatureAttachment>
    </cac:Signature>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="6">${escapeXml(comprobante.emisor.ruc)}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name><![CDATA[${comprobante.emisor.razon_social}]]></cbc:Name>
            </cac:PartyName>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[${comprobante.emisor.razon_social}]]></cbc:RegistrationName>
                <cac:RegistrationAddress>
                    <cbc:ID>${escapeXml(comprobante.emisor.ubigeo)}</cbc:ID>
                    <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
                    <cbc:CityName>${escapeXml(comprobante.emisor.ubigeo)}</cbc:CityName>
                    <cac:AddressLine>
                        <cbc:Line><![CDATA[${comprobante.emisor.direccion}]]></cbc:Line>
                    </cac:AddressLine>
                    <cac:Country>
                        <cbc:IdentificationCode>PE</cbc:IdentificationCode>
                    </cac:Country>
                </cac:RegistrationAddress>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${buildTipoDocumentoReceptor(comprobante.receptor.tipo_documento)}">${escapeXml(comprobante.receptor.numero_documento)}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName><![CDATA[${comprobante.receptor.razon_social}]]></cbc:RegistrationName>${comprobante.receptor.direccion ? `
                <cac:RegistrationAddress>
                    <cac:AddressLine>
                        <cbc:Line><![CDATA[${comprobante.receptor.direccion}]]></cbc:Line>
                    </cac:AddressLine>
                    <cac:Country>
                        <cbc:IdentificationCode>PE</cbc:IdentificationCode>
                    </cac:Country>
                </cac:RegistrationAddress>` : ''}
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${currency}">${formatAmount(comprobante.igv)}</cbc:TaxAmount>${gravadoTotal > 0 ? `
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${currency}">${formatAmount(gravadoTotal)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${currency}">${formatAmount(comprobante.igv)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID>1000</cbc:ID>
                    <cbc:Name>IGV</cbc:Name>
                    <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>` : ''}${exoneradoTotal > 0 ? `
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${currency}">${formatAmount(exoneradoTotal)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${currency}">0.00</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID>9997</cbc:ID>
                    <cbc:Name>EXO</cbc:Name>
                    <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>` : ''}${inafectoTotal > 0 ? `
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${currency}">${formatAmount(inafectoTotal)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${currency}">0.00</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:ID>9998</cbc:ID>
                    <cbc:Name>INA</cbc:Name>
                    <cbc:TaxTypeCode>FRE</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>` : ''}
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${currency}">${formatAmount(comprobante.subtotal)}</cbc:LineExtensionAmount>
        <cbc:TaxInclusiveAmount currencyID="${currency}">${formatAmount(comprobante.total)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${currency}">${formatAmount(comprobante.total)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>${itemsXml}
</${rootTag}>`

  return xml
}
