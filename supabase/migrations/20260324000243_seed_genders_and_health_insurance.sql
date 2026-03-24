-- Seed genders and health insurance (EPS Colombia)
INSERT INTO public.genders (id, name) VALUES
  ('b3719f67-3e64-4f4a-a609-7b334521372b', 'Femenino'),
  ('32f82e7c-7e39-4906-9c41-5d28b3fab3f1', 'Masculino'),
  ('dbd1a6cb-2b6c-4840-b56b-83dc7ae61581', 'Otro')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.health_insurance (id, name) VALUES
  ('7b14bab2-b62b-4fd7-a94d-1e21ca7a2b0f', 'Aliansalud EPS'),
  ('b2f454d6-2348-4f1d-ae87-404c4c9d2f25', 'Anas Wayuu EPSI'),
  ('f79604cc-9e7a-4037-bd53-20ec4bd0a81e', 'Asmet Salud'),
  ('16fd9481-33d4-4bf0-8a38-f58c012927d6', 'Asociación Indígena del Cauca EPSI'),
  ('5a1b2c3d-4e5f-6789-abcd-1234567890ef', 'Cajacopi Atlántico'),
  ('352cfa32-de41-4900-bdb2-2927c9417187', 'Capital Salud EPS-S'),
  ('c8ebc328-0d7d-4092-a879-5f4515b685cb', 'Capresoca'),
  ('ad4a1d53-9189-4919-a909-8ca5ef20856a', 'Comfachocó'),
  ('d25f45f8-f741-4bba-a1b1-915585114f7f', 'Comfaoriente'),
  ('2ea120bb-c389-45ca-84c3-80f62e86cfc1', 'Comfenalco Valle'),
  ('31a69236-bfa5-4fdc-b6f3-49b6c4269149', 'Compensar EPS'),
  ('8f4bd47e-07ac-4d18-b58c-93db8f9bb163', 'Coosalud EPS-S'),
  ('eee8cbfd-19ed-4175-956d-129ba75d3c6b', 'Dusakawi EPSI'),
  ('60b09cce-a0c1-470f-9ef8-ea6fbd605372', 'Emssanar E.S.S.'),
  ('060a90ed-2344-41bf-af9a-cae7a89c9d6a', 'EPM – Empresas Públicas de Medellín'),
  ('a4d7ed3d-c095-4e83-bc43-3e5059458bb2', 'EPS Familiar de Colombia'),
  ('a9e095b6-64da-463a-8dfd-2ad10d2e85d9', 'EPS Sanitas'),
  ('61bf11f2-b288-47d5-be92-a94546157e5a', 'EPS Sura'),
  ('f12784a3-54c6-4eea-9748-2b6b69b47c29', 'Famisanar'),
  ('159fc4e1-ddc9-4485-b46c-328383027035', 'Fondo de Pasivo Social de Ferrocarriles Nacionales de Colombia'),
  ('1966fa0a-d883-4b3c-a5e2-863f11b42119', 'Mallamas EPSI'),
  ('ab3bc976-fb43-451f-ba69-2a507ac2fdff', 'Mutual Ser EPS'),
  ('4c8e70b6-ee3b-437d-89bc-21f55d155c27', 'Nueva EPS'),
  ('7699d9ef-d8ba-4e3d-a687-398a13791faa', 'Pijaos Salud EPSI'),
  ('2b7bf4cf-6f16-44cf-9460-90c5c5962871', 'Salud Mía EPS'),
  ('8952a46d-512b-44ec-9f96-60e217d10a78', 'Salud Total EPS S.A.'),
  ('4b625dbc-636b-4b43-b7bc-1887de79e32a', 'Savia Salud EPS'),
  ('409b003a-5259-43ba-8c62-b0531d0c5899', 'Servicio Occidental de Salud EPS – SOS')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
