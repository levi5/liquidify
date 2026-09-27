export const COMPONENT_NAME_PATTERN = /^[A-Za-z_$][\w$]*$/
export const STYLESHEET_IMPORT_PATTERN = /^[ \t]*import[ \t]+(?:[^'";]*?[ \t]from[ \t]+)?['"]([^'"]+\.(?:css|scss))['"]/gm

export const RAW_LIQUID_GLOBALS_PATTERN =
  /\{\{\s*(routes|shop|store|section|sections|settings|linklists|collections|collection|product|products|all_products|page|pages|article|articles|blog|blogs|cart|search|paginate|template|predictive_search|customer|order|gift_card|content_for_header|content_for_layout)\b/
