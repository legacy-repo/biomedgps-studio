export const parseEntityId = (entityId: string) => {
  const [source, id] = entityId.split(':');

  if (!id) {
    // throw new Error(`Invalid entity id: ${entityId}`);
    return { source: 'unknown', id: source };
  }

  return { source, id };
}

export const entityId2id = (entityId: string) => {
  const { id } = parseEntityId(entityId);
  return id;
}
