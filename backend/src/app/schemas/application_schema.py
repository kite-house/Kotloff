from pydantic import BaseModel, Field
from pydantic_extra_types.phone_numbers import PhoneNumber
from typing import Optional

class Application(BaseModel):
    name: str = Field(min_length=3, max_length=30)
    number: PhoneNumber = Field()
    comment: Optional[str] = Field(None, max_length=400)
    service: Optional[str] = Field(None, max_length=100)