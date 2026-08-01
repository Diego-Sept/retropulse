-- RPC function to increment cluster usage counter
-- Called by lib/planes.ts after successful AI clustering
CREATE OR REPLACE FUNCTION increment_cluster_usage(p_empresa_id UUID, p_mes TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO uso_ia (empresa_id, mes, clusters_usados)
  VALUES (p_empresa_id, p_mes, 1)
  ON CONFLICT (empresa_id, mes)
  DO UPDATE SET clusters_usados = uso_ia.clusters_usados + 1;
END;
$$ LANGUAGE plpgsql;
