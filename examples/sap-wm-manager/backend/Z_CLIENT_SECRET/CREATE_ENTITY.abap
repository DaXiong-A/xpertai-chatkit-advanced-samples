  method /IWBEP/IF_MGW_APPL_SRV_RUNTIME~CREATE_ENTITY.
  DATA:
    LW_ENTITY TYPE ZCLINRTENTIYI,
    lo_http_client TYPE REF TO if_http_client,
    lv_url         TYPE string VALUE 'https://api.mtda.cloud/api/ai/v1/chatkit/sessions',
    lv_status      TYPE i,
    lv_response    TYPE string,
    lv_body        TYPE string.

  lv_body = '{"assistant": {"id": "d7d525e9-cd2d-4ce4-a0bb-bd931b7bdbd4"}, "user": "anonymous"}'.

  CLEAR:
    ER_ENTITY.

  cl_http_client=>create_by_url(
    EXPORTING
      url                = lv_url
    IMPORTING
      client             = lo_http_client
    EXCEPTIONS
      others             = 1 ).

  IF sy-subrc <> 0.
    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception.
  ENDIF.

  lo_http_client->request->set_method( 'POST' ).

  "设置请求头
  lo_http_client->request->set_header_field(
    name  = 'Content-Type'
    value = 'application/json' ).

  lo_http_client->request->set_header_field(
    name  = 'Accept'
    value = 'application/json' ).

  TRY.
      lo_http_client->request->set_header_field(
        name  = 'Authorization'
        value = 'Bearer sk-x-OtL' ).
    CATCH cx_root.
  ENDTRY.

  lo_http_client->request->set_cdata( lv_body ).

    lo_http_client->send(
    EXCEPTIONS
      http_communication_failure = 1
      http_invalid_state         = 2
      http_processing_failed     = 3
      http_invalid_timeout       = 4
      others                     = 5 ).

  IF sy-subrc <> 0.
    lo_http_client->close( ).
    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception.
  ENDIF.

   lo_http_client->receive(
    EXCEPTIONS
      http_communication_failure = 1
      http_invalid_state         = 2
      http_processing_failed     = 3
      others                     = 4 ).

   IF sy-subrc <> 0.
    lo_http_client->close( ).
    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception.
  ENDIF.

  lo_http_client->response->get_status( IMPORTING code = lv_status ).

  lv_response = lo_http_client->response->get_cdata( ).

  lo_http_client->close( ).

  IF lv_status <> 201.
    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception
      EXPORTING
        textid = /iwbep/cx_mgw_busi_exception=>business_error
        message = |API调用失败，状态码: { lv_status }|.
  ENDIF.

  DATA: lv_secret TYPE string.

  FIND '"client_secret":"' IN lv_response.
  IF sy-subrc = 0.
    DATA(lv_offset) = sy-fdpos + 18. "client_secret":"的长度
    DATA(lv_end) = lv_offset.

    FIND '"' IN SECTION OFFSET lv_end OF lv_response MATCH OFFSET DATA(lv_end_pos).
    IF sy-subrc = 0.
      DATA(lv_length) = lv_end_pos - lv_offset. 
      lv_secret = lv_response+lv_offset(lv_length)..
    ENDIF.
  ENDIF.

  IF lv_secret IS NOT INITIAL.

   LW_ENTITY-Clientsecret = lv_secret.
     CALL METHOD COPY_DATA_TO_REF
       EXPORTING
         IS_DATA      = LW_ENTITY
      CHANGING
         CR_DATA      = ER_ENTITY.
  ELSE.
    RAISE EXCEPTION TYPE /iwbep/cx_mgw_busi_exception
      EXPORTING
        textid = /iwbep/cx_mgw_busi_exception=>business_error
        message = '未找到client_secret字段'.
  ENDIF.
  endmethod.
